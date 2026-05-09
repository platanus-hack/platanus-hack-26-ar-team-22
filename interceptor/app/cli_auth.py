"""Resolve a CLI token (carried in the URL path) to its owning member.

The CLI writes `ANTHROPIC_BASE_URL=<proxy>/cli/<token>` into the user's shell
rc. Claude Code therefore prepends `/cli/<token>` to every API call. The
interceptor strips it, hashes the token, and looks up the member here so
each `interactions` row gets a `user_id` (and an org override).

Layout in DB (schema lives in `web/prisma/schema.prisma`):
  - cli_tokens.token_hash  ← sha256 hex of the plaintext we just received
  - cli_tokens.member_id    → members.id
  - members.org_id          → organizations.id
"""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from .models import CliToken, Member

logger = logging.getLogger("app.cli_auth")


@dataclass
class CliCaller:
    member_id: UUID
    org_id: str
    email: str


def hash_token(plaintext: str) -> str:
    return hashlib.sha256(plaintext.encode("utf-8")).hexdigest()


async def resolve_cli_token(session: AsyncSession, token: str) -> CliCaller | None:
    """Return the caller for a plaintext CLI token, or None if unknown/revoked.

    Bumps `last_used_at` on success — this is what powers the "last seen"
    column in /admin/team without writing on every prompt's hot path
    (sqlite-style: it's already in the DB roundtrip we need anyway).
    """
    if not token:
        return None

    token_hash = hash_token(token)
    row = (
        await session.exec(select(CliToken).where(CliToken.token_hash == token_hash))
    ).first()

    if row is None:
        logger.info("[cli-auth] unknown token (no row)")
        return None
    if row.revoked_at is not None:
        logger.info("[cli-auth] revoked token member=%s", row.member_id)
        return None

    member = (
        await session.exec(select(Member).where(Member.id == row.member_id))
    ).first()
    if member is None:
        logger.info("[cli-auth] dangling token (member missing) id=%s", row.id)
        return None

    row.last_used_at = datetime.utcnow()
    session.add(row)
    await session.commit()

    return CliCaller(member_id=member.id, org_id=member.org_id, email=member.email)
