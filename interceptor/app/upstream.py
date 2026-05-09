"""HTTP client to forward requests to api.anthropic.com.

We always open the upstream call as a stream and pipe raw bytes back to
the caller. This makes both streaming (SSE) and non-streaming (JSON)
responses Just Work — we never re-parse the body, so we can't corrupt it.

A single shared httpx.AsyncClient is created at app startup so connection
pooling pays off.
"""

from collections.abc import AsyncIterator

import httpx

from .config import settings

_client: httpx.AsyncClient | None = None

# Hop-by-hop and content-length headers we must NOT relay back to the caller —
# httpx already decoded the body and Starlette will set its own length.
_FORBIDDEN_RESPONSE_HEADERS = {
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
}

# Headers we drop from inbound before forwarding upstream.
_FORBIDDEN_REQUEST_HEADERS = {
    "host",
    "content-length",
    "connection",
    "transfer-encoding",
}


def init_client() -> None:
    global _client
    _client = httpx.AsyncClient(
        base_url=settings.anthropic_upstream_url,
        timeout=httpx.Timeout(120.0, connect=5.0),
    )


async def close_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def filtered_request_headers(headers: dict[str, str]) -> dict[str, str]:
    return {k: v for k, v in headers.items() if k.lower() not in _FORBIDDEN_REQUEST_HEADERS}


def filtered_response_headers(headers: httpx.Headers) -> dict[str, str]:
    return {k: v for k, v in headers.items() if k.lower() not in _FORBIDDEN_RESPONSE_HEADERS}


async def open_upstream(
    method: str,
    path: str,
    body: bytes,
    headers: dict[str, str],
    query_string: str = "",
) -> httpx.Response:
    """Open a streamed upstream call. Returns the open Response — the caller
    is responsible for iterating its body and closing it via `aclose()`."""
    if _client is None:
        raise RuntimeError("upstream client not initialised")

    full_path = f"{path}?{query_string}" if query_string else path
    request = _client.build_request(
        method,
        full_path,
        content=body,
        headers=filtered_request_headers(headers),
    )
    return await _client.send(request, stream=True)


async def stream_response(response: httpx.Response) -> AsyncIterator[bytes]:
    """Pipe upstream bytes through, decompressed, then close the connection.

    `aiter_bytes()` (not `aiter_raw()`) is critical: Anthropic frequently
    gzip-encodes JSON responses and `aiter_raw()` would forward the
    compressed bytes while we strip `content-encoding` from the headers,
    leaving the client unable to decode them.
    """
    try:
        async for chunk in response.aiter_bytes():
            yield chunk
    finally:
        await response.aclose()
