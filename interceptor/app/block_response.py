"""Synthesises an Anthropic-shaped response when policy decision is BLOCK.

We expose two shapes:
  - JSON Message — for clients that don't request streaming.
  - SSE event sequence — for clients that pass `stream: true` (Claude Code's
    default). We emit the same event order Anthropic does so the CLI's
    streaming parser doesn't break.

We always return HTTP 200: Claude Code surfaces the body to the dev as if
Claude had answered, so the UX is "request was blocked by policy X" instead
of an opaque network error.
"""

import json
from collections.abc import AsyncIterator

from .cascade import PolicyHit


def _block_text(hit: PolicyHit) -> str:
    return (
        f"Antes de continuar, hay algo que vale la pena tener en cuenta. "
        f"Tu mensaje se cruza con la política **{hit.slug}** de tu organización:\n\n"
        f"> {hit.rule}\n\n"
        f"La idea no es frenarte sino asegurarnos de que el entregable quede alineado "
        f"con lo que la empresa espera. Si reformulás el prompt sin incluir esa información, "
        f"puedo procesarlo normalmente. Si el contexto es imprescindible para tu tarea, "
        f"coordiná con tu admin.\n\n"
        f"¿Querés que te ayude a reformularlo? Contame qué estás intentando hacer "
        f"y lo armamos juntos respetando la política.\n\n"
        f"— Tranquera"
    )


def synthesize_block_message(model: str, trace_id: str, hit: PolicyHit) -> dict:
    return {
        "id": f"msg_tranquera_blocked_{trace_id}",
        "type": "message",
        "role": "assistant",
        "model": model,
        "content": [{"type": "text", "text": _block_text(hit)}],
        "stop_reason": "tranquera_blocked",
        "stop_sequence": None,
        "usage": {"input_tokens": 0, "output_tokens": 0},
    }


def _sse(event: str, data: dict) -> bytes:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n".encode()


async def synthesize_block_sse(
    model: str, trace_id: str, hit: PolicyHit
) -> AsyncIterator[bytes]:
    """Mirror Anthropic's streaming event order so the CLI parses it cleanly."""
    msg_id = f"msg_tranquera_blocked_{trace_id}"
    text = _block_text(hit)

    yield _sse(
        "message_start",
        {
            "type": "message_start",
            "message": {
                "id": msg_id,
                "type": "message",
                "role": "assistant",
                "model": model,
                "content": [],
                "stop_reason": None,
                "stop_sequence": None,
                "usage": {"input_tokens": 0, "output_tokens": 0},
            },
        },
    )
    yield _sse(
        "content_block_start",
        {
            "type": "content_block_start",
            "index": 0,
            "content_block": {"type": "text", "text": ""},
        },
    )
    yield _sse(
        "content_block_delta",
        {
            "type": "content_block_delta",
            "index": 0,
            "delta": {"type": "text_delta", "text": text},
        },
    )
    yield _sse(
        "content_block_stop",
        {"type": "content_block_stop", "index": 0},
    )
    yield _sse(
        "message_delta",
        {
            "type": "message_delta",
            "delta": {"stop_reason": "tranquera_blocked", "stop_sequence": None},
            "usage": {"output_tokens": 0},
        },
    )
    yield _sse("message_stop", {"type": "message_stop"})
