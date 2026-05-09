"""Insert a minimal set of regex policies for org 'demo'.

Idempotent — re-running just updates the existing rows by (org_id, slug).
This lives here only so the interceptor can be smoke-tested in isolation
before the real seed lands in web/. Once `pnpm seed:vdb` exists, drop this.
"""

import asyncio
import sys
from pathlib import Path

# Allow running as `python scripts/seed_policies.py` from interceptor/.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.dialects.postgresql import insert as pg_insert  # noqa: E402

from app.db import async_session_maker, engine  # noqa: E402
from app.enums import Action, PolicyDomain, PolicyLayer, PolicySource, Severity  # noqa: E402
from app.models import Policy  # noqa: E402

SEED: list[dict] = [
    {
        "slug": "aws-access-key",
        "domain": PolicyDomain.credentials,
        "layer": PolicyLayer.regex,
        "rule": "AWS Access Key ID expuesta en un prompt",
        "pattern": r"AKIA[0-9A-Z]{16}",
        "default_action": Action.BLOCK,
        "severity": Severity.high,
    },
    {
        "slug": "github-token",
        "domain": PolicyDomain.credentials,
        "layer": PolicyLayer.regex,
        "rule": "GitHub Personal Access Token (classic o fine-grained)",
        "pattern": r"gh[pousr]_[A-Za-z0-9]{36,}",
        "default_action": Action.BLOCK,
        "severity": Severity.high,
    },
    {
        "slug": "pem-private-key",
        "domain": PolicyDomain.credentials,
        "layer": PolicyLayer.regex,
        "rule": "Private key PEM en clear-text",
        "pattern": r"-----BEGIN (RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----",
        "default_action": Action.BLOCK,
        "severity": Severity.high,
    },
    {
        "slug": "anthropic-api-key",
        "domain": PolicyDomain.credentials,
        "layer": PolicyLayer.regex,
        "rule": "Anthropic API key compartida en el prompt",
        "pattern": r"sk-ant-[A-Za-z0-9_\-]{20,}",
        "default_action": Action.BLOCK,
        "severity": Severity.high,
    },
]


async def main(org_id: str = "demo") -> None:
    async with async_session_maker() as session:
        for row in SEED:
            stmt = (
                pg_insert(Policy.__table__)
                .values(
                    org_id=org_id,
                    source=PolicySource.seed.value,
                    is_active=True,
                    **{
                        k: (v.value if hasattr(v, "value") else v)
                        for k, v in row.items()
                    },
                )
                .on_conflict_do_update(
                    index_elements=["org_id", "slug"],
                    set_={
                        "domain": row["domain"].value,
                        "layer": row["layer"].value,
                        "rule": row["rule"],
                        "pattern": row["pattern"],
                        "default_action": row["default_action"].value,
                        "severity": row["severity"].value,
                        "is_active": True,
                    },
                )
            )
            await session.execute(stmt)
        await session.commit()
    await engine.dispose()
    print(f"Seeded {len(SEED)} regex policies for org_id={org_id!r}.")


if __name__ == "__main__":
    asyncio.run(main())
