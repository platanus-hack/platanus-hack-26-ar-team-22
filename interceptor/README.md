# Tranquera — interceptor (v0.3)

Proxy Python que se mete entre Claude Code y `api.anthropic.com`. Lee
políticas de Postgres (la DB que comparte con `web/`) y aplica la
cascada antes de forwardear.

**v0.3 alcance**:

- **Layer 1 — Regex**: matchers literales contra el prompt. Acciones `BLOCK` y `LOG` (passthrough).
- **Layer 3 — NL Judge** (Haiku 4.5): si regex no bloqueó y hay reglas en lenguaje natural activas, manda el prompt + reglas a Haiku en una sola call y aplica el resultado.
- **Atribución por dev** (path-based): además de `POST /v1/messages` (compat) acepta `POST /cli/{token}/v1/messages`. El CLI bakea el token en `ANTHROPIC_BASE_URL=<proxy>/cli/<token>` durante `tranquera setup`, y cada `interactions` queda atado al `member_id` correcto + override del `org_id`. El token se hashea (sha256) y se mira en `cli_tokens`; si no existe / está revocado → 401. Token desconocido en `count_tokens` no bloquea (solo el path real lo hace).
- Logging estructurado (`[req] [regex] [nl] [judge] [done]`) para tracear cada paso. `[req]` ahora incluye `user=<member_id>` cuando el caller vino vía `/cli/{token}`.

REDACT, WARN y Layer 2 (pattern matcher) quedan para próximas versiones.

## Stack

- Python 3.12 + FastAPI + uvicorn.
- SQLModel + asyncpg sobre la Postgres compartida con `web/`.
- httpx async para reenviar a Anthropic **y** para llamar al judge (Haiku 4.5).
- `uv` para deps.

> El schema canónico vive en `web/prisma/schema.prisma`. Este servicio
> **no** ejecuta migraciones — sólo lee `policies` y escribe `interactions`.

## Setup

Desde el root del repo, asegurate que Postgres esté arriba y migrado por
`web/`:

```bash
docker compose up -d
cd web && pnpm install && pnpm prisma migrate deploy
```

Después, el interceptor:

```bash
cd interceptor
cp .env.example .env        # editar — ANTHROPIC_JUDGE_API_KEY es la única clave a pegar
uv sync                     # instala deps
uv run python scripts/seed_policies.py   # 4 reglas regex de credenciales
uv run uvicorn app.main:app --reload --port 8080
```

> **Habilitar el NL judge** (opcional pero recomendado): pegá una API key de Anthropic en `ANTHROPIC_JUDGE_API_KEY` (sacala de <https://console.anthropic.com/settings/keys>). Si está vacía, el proxy se comporta como v0.1 (solo regex + passthrough). El judge corre con la key del servidor — no depende de las credenciales del cliente, así que evita problemas de OAuth scopes y betas no habilitadas.

## Smoke test

**BLOCK** (no requiere `ANTHROPIC_API_KEY` real — la cascada decide antes
de tocar upstream):

```bash
curl -i -X POST http://localhost:8080/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-team22-org-key: demo" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 256,
    "messages": [{"role":"user","content":"AKIAIOSFODNN7EXAMPLE"}]
  }'
```

Esperado: `HTTP 200`, header `x-team22-action: BLOCK`,
`stop_reason: tranquera_blocked` y un mensaje en español explicando la regla.

**LOG passthrough** (requiere `x-api-key` válida para que Anthropic
responda 200; con key fake devuelve 401 propagado):

```bash
curl -i -X POST http://localhost:8080/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "x-team22-org-key: demo" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 256,
    "messages": [{"role":"user","content":"explicame el patrón Observer"}]
  }'
```

Esperado: el status code y el body son lo que Anthropic devolvió;
agregamos sólo `x-team22-trace-id` y `x-team22-action: LOG`.

## Probar contra el CLI real

```bash
ANTHROPIC_BASE_URL=http://localhost:8080 claude "AKIAIOSFODNN7EXAMPLE"
```

El CLI debería renderizar el mensaje del proxy como si fuera respuesta
del modelo.

## Estructura

```
interceptor/
├── app/
│   ├── main.py             # FastAPI app + POST /v1/messages (cascada)
│   ├── config.py           # settings desde .env
│   ├── db.py               # async engine + session
│   ├── enums.py            # mirrors de los enums Postgres
│   ├── models.py           # SQLModel: Policy (read), Interaction (write)
│   ├── schemas.py          # Pydantic shapes de la Messages API
│   ├── cascade.py          # Layer 1 — regex matcher
│   ├── nl_layer.py         # Layer 3 — Haiku 4.5 judge (httpx → Anthropic)
│   ├── redact.py           # redacción del prompt antes de persistir
│   ├── block_response.py   # synthesizer de Message en BLOCK
│   └── upstream.py         # cliente httpx contra api.anthropic.com
└── scripts/
    └── seed_policies.py    # 4 reglas regex idempotentes (org='demo')
```

## Deploy a Railway

El servicio está pensado para correr en Railway con la Postgres compartida
en Supabase.

### 1 — preparar la DB

El schema canónico vive en `web/prisma/`. Antes del primer deploy:

1. Crear proyecto en Supabase y habilitar la extensión `vector`
   (Dashboard → Database → Extensions).
2. Desde `web/`, apuntar `DATABASE_URL` al DSN directo de Supabase
   (no el pooler) y correr `pnpm prisma migrate deploy`.
3. Sembrar al menos las regex iniciales (por ahora,
   `cd interceptor && uv run python scripts/seed_policies.py`
   con la `DATABASE_URL` de Supabase).

### 2 — crear el servicio en Railway

Desde `interceptor/` con `railway` CLI logueado:

```bash
railway login                 # si no estás logueado
railway init                  # crea proyecto, o `railway link` para uno existente
railway variables \
  --set DATABASE_URL='postgresql://postgres:<password>@<host>:5432/postgres' \
  --set ANTHROPIC_UPSTREAM_URL='https://api.anthropic.com' \
  --set ANTHROPIC_JUDGE_API_KEY='sk-ant-...' \
  --set DEFAULT_ORG_ID='demo'
railway up
```

El root del servicio en Railway tiene que ser `interceptor/` (configurable
en Settings → Source → Root Directory si lo creaste desde el dashboard).

### 3 — verificar

```bash
curl https://<tu-dominio>.up.railway.app/health
# → {"status":"ok"}
```

Y desde el CLI:

```bash
ANTHROPIC_BASE_URL=https://<tu-dominio>.up.railway.app claude "AKIAIOSFODNN7EXAMPLE"
```

### Notas

- **Driver async**: `app/db.py` reescribe automáticamente `postgresql://` →
  `postgresql+asyncpg://`. Pegá el DSN de Supabase tal cual.
- **SSL**: la conexión a hosts no-locales fuerza `ssl=require`. No hace
  falta tocar nada para Supabase.
- **Pooler vs direct**: usar la connection direct (puerto 5432) — el pooler
  de Supabase (puerto 6543) usa pgbouncer en transaction mode y necesita
  `prepared_statement_cache_size=0`, no soportado en v0.1.

## Próximas versiones

- v0.4 — REDACT mutator + WARN.
- v0.5 — Layer 2 (pattern matcher para filename/path).
- v0.6 — embedding-based pre-filter (pgvector top-K) antes del judge.
- v0.7 — streaming (`stream: true` para chat normal del CLI).
- v0.8 — fail-closed real cuando upstream timeoutea.
