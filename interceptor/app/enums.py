"""Mirrors Postgres enum types declared in web/prisma/schema.prisma.

The Postgres types are quoted PascalCase (e.g. `"Action"`); we reuse them
via `create_type=False` so the interceptor never owns DDL — `web/prisma/`
is the single source of truth for the schema.
"""

from enum import Enum


class Action(str, Enum):
    BLOCK = "BLOCK"
    REDACT = "REDACT"
    WARN = "WARN"
    LOG = "LOG"


class PolicyLayer(str, Enum):
    regex = "regex"
    pattern = "pattern"
    nl = "nl"


class PolicySource(str, Enum):
    seed = "seed"
    admin = "admin"
    ai_suggestor = "ai-suggestor"
    google_workspace = "google-workspace"


class Severity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class PolicyDomain(str, Enum):
    credentials = "credentials"
    pii = "pii"
    internal_paths = "internal_paths"
    business_policy = "business_policy"
    code = "code"


_ACTION_PRIORITY = {Action.BLOCK: 4, Action.REDACT: 3, Action.WARN: 2, Action.LOG: 1}


def winning_action(actions: list[Action]) -> Action:
    """BLOCK > REDACT > WARN > LOG. Empty list → LOG (default passthrough)."""
    if not actions:
        return Action.LOG
    return max(actions, key=lambda a: _ACTION_PRIORITY[a])
