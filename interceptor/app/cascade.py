"""Layer 1 — regex cascade.

Compiles each policy's pattern once per request batch and scans the
extracted prompt texts. A single hit per policy is enough; we don't try
to count occurrences.
"""

import re
from dataclasses import dataclass
from typing import Any

from .enums import Action, PolicyLayer
from .models import Policy
from .schemas import MessagesRequest


@dataclass
class PolicyHit:
    policy_id: str
    slug: str
    layer: PolicyLayer
    action: Action
    rule: str
    matched_text: str

    def to_record(self) -> dict[str, Any]:
        """Shape persisted in interactions.policy_hits (no matched text — leak risk)."""
        return {
            "layer": self.layer.value,
            "policy_id": self.policy_id,
            "slug": self.slug,
            "action": self.action.value,
        }


def extract_texts(req: MessagesRequest) -> list[str]:
    """Pull every user-authored string from the request body.

    System prompts are author-controlled today but admins may inline
    secrets in them, so we scan those too.
    """
    texts: list[str] = []

    if isinstance(req.system, str):
        texts.append(req.system)
    elif isinstance(req.system, list):
        texts.extend(b.get("text", "") for b in req.system if b.get("type") == "text")

    for msg in req.messages:
        if isinstance(msg.content, str):
            texts.append(msg.content)
        else:
            texts.extend(b.get("text", "") for b in msg.content if b.get("type") == "text")

    return [t for t in texts if t]


def _as_layer(v: object) -> PolicyLayer:
    return v if isinstance(v, PolicyLayer) else PolicyLayer(v)


def _as_action(v: object) -> Action:
    return v if isinstance(v, Action) else Action(v)


def run_regex_layer(req: MessagesRequest, policies: list[Policy]) -> list[PolicyHit]:
    texts = extract_texts(req)
    hits: list[PolicyHit] = []

    for policy in policies:
        layer = _as_layer(policy.layer)
        if layer != PolicyLayer.regex or not policy.pattern:
            continue
        try:
            compiled = re.compile(policy.pattern)
        except re.error:
            # A malformed pattern shouldn't crash the proxy; skip it.
            continue
        for text in texts:
            match = compiled.search(text)
            if match:
                hits.append(
                    PolicyHit(
                        policy_id=str(policy.id),
                        slug=policy.slug,
                        layer=layer,
                        action=_as_action(policy.default_action),
                        rule=policy.rule,
                        matched_text=match.group(0),
                    )
                )
                break

    return hits
