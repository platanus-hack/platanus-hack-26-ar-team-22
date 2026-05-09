from collections.abc import AsyncIterator
from urllib.parse import urlparse

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession

from .config import settings


def _normalize_url(url: str) -> str:
    """Accept the conventional `postgresql://...` DSN that Supabase, Neon and
    Railway hand out, and rewrite it to the asyncpg driver SQLAlchemy needs."""
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url[len("postgresql://") :]
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url[len("postgres://") :]
    return url


def _connect_args(url: str) -> dict:
    """Force TLS for public remote hosts only.

    Internal Railway/Fly addresses (`*.railway.internal`, `*.flycast`) live on
    the platform's private network and don't terminate SSL; forcing TLS there
    would fail the handshake. asyncpg accepts a string SSL mode.
    """
    host = urlparse(url).hostname or ""
    is_local = (
        host in {"", "localhost", "127.0.0.1", "host.docker.internal"}
        or host.endswith(".railway.internal")
        or host.endswith(".flycast")
    )
    if is_local:
        return {}
    return {"ssl": "require"}


_url = _normalize_url(settings.database_url)

engine = create_async_engine(
    _url,
    echo=False,
    pool_pre_ping=True,
    connect_args=_connect_args(_url),
)

async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with async_session_maker() as session:
        yield session
