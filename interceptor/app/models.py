"""SQLModel mappings to the shared Postgres schema owned by web/prisma/.

The interceptor reads `policies` and writes `interactions`. We do NOT
declare relationships, embeddings, or columns the proxy doesn't touch —
this keeps the mapping minimal and avoids pulling pgvector types we
can't yet round-trip from Python.
"""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID as PgUUID
from sqlmodel import Field, SQLModel

from .enums import Action, PolicyDomain, PolicyLayer, PolicySource, Severity


def _pg_enum(enum_cls: type, name: str) -> PgEnum:
    """Bind to an existing Postgres enum type without creating it."""
    return PgEnum(
        *[e.value for e in enum_cls],
        name=name,
        create_type=False,
    )


class Policy(SQLModel, table=True):
    __tablename__ = "policies"

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(PgUUID(as_uuid=True), primary_key=True),
    )
    org_id: str = Field(default="demo")
    slug: str
    domain: PolicyDomain = Field(sa_column=Column(_pg_enum(PolicyDomain, "PolicyDomain")))
    layer: PolicyLayer = Field(sa_column=Column(_pg_enum(PolicyLayer, "PolicyLayer")))
    rule: str
    pattern: str | None = Field(default=None)
    match_config: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column("match_config", JSONB),
    )
    default_action: Action = Field(sa_column=Column(_pg_enum(Action, "Action")))
    severity: Severity = Field(
        default=Severity.medium,
        sa_column=Column(_pg_enum(Severity, "Severity")),
    )
    source: PolicySource = Field(
        default=PolicySource.seed,
        sa_column=Column(_pg_enum(PolicySource, "PolicySource")),
    )
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Interaction(SQLModel, table=True):
    __tablename__ = "interactions"

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(PgUUID(as_uuid=True), primary_key=True),
    )
    trace_id: str = Field(unique=True)
    org_id: str = Field(default="demo")
    user_id: UUID | None = Field(
        default=None,
        sa_column=Column(PgUUID(as_uuid=True), nullable=True),
    )
    request_model: str
    prompt: str
    action: Action = Field(sa_column=Column(_pg_enum(Action, "Action")))
    reason: str
    policy_hits: list[dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column("policy_hits", JSONB),
    )
    latency_total_ms: int
    latency_by_layer: dict[str, int] = Field(
        default_factory=dict,
        sa_column=Column("latency_by_layer", JSONB),
    )
    upstream_status: int | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
