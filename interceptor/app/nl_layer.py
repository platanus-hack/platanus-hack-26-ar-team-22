"""Layer 3 — natural-language judge.

Sends the user's prompt + every active NL policy to Haiku 4.5 in a single
call and asks it which policies the prompt violates. The response is a
strict JSON list of matched policy ids.

Design choices for the hack:
- httpx (already a dep), not the official SDK — keeps the dep surface tight.
- The judge uses its own server-side API key (`ANTHROPIC_JUDGE_API_KEY`),
  not the client's credentials. This decouples the judge from whatever the
  customer is doing (OAuth subscriptions, betas, scopes) and makes costs
  attributable to the operator.
- Fail-open on any error (network, malformed JSON, missing key, timeout).
  The proxy must never block legitimate traffic because the judge sneezed.
"""

import json
import logging
import re
from typing import Any

import httpx

from .cascade import PolicyHit, extract_texts
from .config import settings
from .enums import Action, PolicyLayer
from .models import Policy
from .schemas import MessagesRequest

logger = logging.getLogger("app.nl_layer")


def _enum_value(v: object) -> str:
    """Postgres enums roundtrip through SQLModel as raw strings sometimes
    instead of Python Enum instances. Handle both shapes defensively."""
    return v.value if hasattr(v, "value") else str(v)


JUDGE_MODEL = "claude-haiku-4-5-20251001"
JUDGE_MAX_TOKENS = 256
JUDGE_TIMEOUT_S = 5.0
ANTHROPIC_VERSION = "2023-06-01"

_JSON_BLOCK = re.compile(r"\{.*\}", re.DOTALL)

JUDGE_SYSTEM = (
    "Sos un judge de seguridad de datos para una empresa que usa Claude Code. "
    "Te paso una lista de reglas (cada una con un id) y el prompt que un "
    "developer le mandó al modelo. Tu trabajo es decidir, regla por regla, si "
    "el prompt la viola.\n\n"
    "Reglas para decidir:\n"
    "- Marcá una regla SOLO si el prompt claramente la viola.\n"
    "- En la duda, NO marques. Falsos positivos son peores que falsos "
    "negativos: bloquean trabajo legítimo.\n"
    "- Considerá ejemplos, contexto y sinónimos razonables.\n\n"
    "Devolvé SOLO un JSON con la forma:\n"
    '{"matched": ["<policy_id>", "..."]}\n'
    "Si ninguna regla matchea, devolvé exactamente: "
    '{"matched": []}\n'
    "No agregues explicación, no envuelvas en ```json, no agregues prefijos."
)


def _format_rules_block(policies: list[Policy]) -> str:
    lines = []
    for p in policies:
        lines.append(
            f"- id={p.id} | accion={_enum_value(p.default_action)} | "
            f"dominio={_enum_value(p.domain)}\n"
            f"  regla: {p.rule}"
        )
    return "\n".join(lines)


def _format_prompt_block(req: MessagesRequest) -> str:
    parts = extract_texts(req)
    return "\n---\n".join(parts) if parts else ""


def _build_judge_messages(policies: list[Policy], req: MessagesRequest) -> list[dict[str, Any]]:
    user_content = (
        "REGLAS ACTIVAS:\n"
        f"{_format_rules_block(policies)}\n\n"
        "PROMPT DEL USUARIO:\n"
        f"```\n{_format_prompt_block(req)}\n```\n\n"
        'Respondé SOLO el JSON: {"matched": ["<id>", ...]}'
    )
    return [{"role": "user", "content": user_content}]


def _parse_matched_ids(content_text: str) -> list[str]:
    """Anthropic vuelve con un único bloque text que esperamos sea JSON.
    Toleramos prefijo/sufijo espurio buscando el primer {...} balanceado."""
    if not content_text:
        return []
    candidate = content_text.strip()
    match = _JSON_BLOCK.search(candidate)
    if match:
        candidate = match.group(0)
    try:
        data = json.loads(candidate)
    except json.JSONDecodeError:
        return []
    raw = data.get("matched")
    if not isinstance(raw, list):
        return []
    return [str(x) for x in raw if isinstance(x, str)]


def is_enabled() -> bool:
    """True si el judge tiene credenciales para correr."""
    return bool(settings.anthropic_judge_api_key)


async def run_nl_layer(
    req: MessagesRequest,
    policies: list[Policy],
) -> list[PolicyHit]:
    """Returns PolicyHits for every policy the judge marked as violated.

    Fails open: any error path returns []. Caller should treat that as
    "nothing matched" and continue with the cascade.
    """
    if not policies:
        return []
    api_key = settings.anthropic_judge_api_key
    if not api_key:
        return []

    body = {
        "model": JUDGE_MODEL,
        "max_tokens": JUDGE_MAX_TOKENS,
        "system": JUDGE_SYSTEM,
        "messages": _build_judge_messages(policies, req),
    }

    headers = {
        "x-api-key": api_key,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
    }

    logger.info(
        "[judge] POST %s/v1/messages model=%s policies=%d",
        settings.anthropic_upstream_url, JUDGE_MODEL, len(policies),
    )
    try:
        async with httpx.AsyncClient(
            base_url=settings.anthropic_upstream_url,
            timeout=httpx.Timeout(JUDGE_TIMEOUT_S, connect=3.0),
        ) as client:
            resp = await client.post(
                "/v1/messages",
                json=body,
                headers=headers,
            )
        if resp.status_code != 200:
            logger.warning(
                "[judge] non-200 status=%d body=%s",
                resp.status_code, resp.text[:300],
            )
            return []
        payload = resp.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("[judge] error %s: %s", type(exc).__name__, exc)
        return []

    text_chunks = [
        block.get("text", "")
        for block in payload.get("content", [])
        if isinstance(block, dict) and block.get("type") == "text"
    ]
    raw_text = "".join(text_chunks)
    logger.info("[judge] response_text=%r", raw_text[:300])
    matched_ids = _parse_matched_ids(raw_text)
    logger.info("[judge] matched_ids=%s", matched_ids)
    if not matched_ids:
        return []

    by_id = {str(p.id): p for p in policies}
    hits: list[PolicyHit] = []
    for policy_id in matched_ids:
        policy = by_id.get(policy_id)
        if policy is None:
            continue
        hits.append(
            PolicyHit(
                policy_id=str(policy.id),
                slug=policy.slug,
                layer=PolicyLayer.nl,
                action=Action(_enum_value(policy.default_action)),
                rule=policy.rule,
                matched_text="",  # judge no devuelve span; storage no lo necesita
            )
        )
    return hits
