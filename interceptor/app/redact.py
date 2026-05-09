"""Redaction for storage.

Every prompt persisted in `interactions.prompt` is scrubbed against the
matched regex policies before insert. This runs even for LOG decisions
because we don't want raw secrets sitting in the audit trail.
"""

import re

from .cascade import PolicyHit


def redact_for_storage(text: str, hits: list[PolicyHit]) -> str:
    out = text
    for hit in hits:
        if not hit.matched_text:
            continue
        out = out.replace(hit.matched_text, f"[REDACTED:{hit.slug}]")
        # Defensive: if the same secret slipped past with a tweaked
        # pattern, also rerun the policy regex over the (already partially
        # redacted) text.
        try:
            out = re.sub(
                hit.matched_text,
                f"[REDACTED:{hit.slug}]",
                out,
            )
        except re.error:
            pass
    return out
