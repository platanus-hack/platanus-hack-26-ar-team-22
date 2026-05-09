# 07 — Requirements & Docs técnicos

> Lo que hace falta para correr / desplegar el proyecto. Y la documentación pública del proxy.

---

## Contexto

Sin un doc claro de requirements:

- Cuando el primer dev clona el repo, pierde 30 min descubriendo que falta un env var.
- Cuando alguien quiere apuntar Claude Code al proxy, no sabe qué `ANTHROPIC_BASE_URL` poner ni qué headers manda.
- Cuando submiteamos al hack, los jurados no van a poder correrlo localmente.

Este spec consolida: prerequisites, env vars, scripts, runbook, troubleshooting, y un OpenAPI mínimo del endpoint `POST /v1/messages`.

---

## Goals

- `README.md` técnico (separado del README "vidriera") con TODO lo necesario para correr local.
- `.env.example` con cada variable comentada.
- `docs/api.md` con la spec del endpoint del proxy y ejemplo de configuración de Claude Code.
- `docs/runbook.md` con qué hacer cuando algo falla.
- Cualquier dev externo que clone el repo puede correr `pnpm install && pnpm dev` y tener `/admin` funcionando + Claude Code apuntando al proxy local en menos de 15 min (asumiendo que tiene cuentas Supabase y Anthropic).

## Non-Goals

- No documentación full de cada paquete interno (los specs ya cubren eso).
- No diagrama UML / ERD detallado (el spec 01 ya tiene el flow).
- No tutorial paso a paso de cómo crear cuenta Supabase / Anthropic (linkeamos a sus docs).
- No guía de instalación de Claude Code (linkeamos a docs.claude.com).

---

## User Stories

- **Como dev nuevo en el repo**, quiero seguir un README y tener `pnpm dev` funcionando en 15 min.
- **Como integrador externo (admin de empresa)**, quiero leer cómo configurar Claude Code para que pase por nuestro proxy en 1 minuto.
- **Como demo runner el día del pitch**, quiero un runbook de "qué hacer si X falla".

---

## Acceptance Criteria

- [ ] `README.dev.md` (en root, separado del de marketing/submission) con secciones: Prerequisites, Setup, Scripts, Estructura, Cómo contribuir.
- [ ] `.env.example` con todas las variables que usan los specs 01-04 + 08.
- [ ] `docs/api.md` con shape de request/response del proxy, errores, ejemplos `curl` y bloque "Cómo configurar Claude Code".
- [ ] `docs/runbook.md` con ≥ 5 escenarios de fallo y su fix.
- [ ] `pnpm install && pnpm seed:vdb && pnpm dev` levanta el sistema completo si las env están ok.
- [ ] Submit final: `platanus-hack-project.json` con `project-name`, `project-oneliner-spanish` y `project-description-spanish` reales (no placeholders).

---

## Interfaces / Contratos

### Variables de entorno (target `web/.env.example`)

```bash
# --- Database ---
# Local: docker-compose en root del repo (`docker compose up`)
# Prod : Supabase Postgres (Settings → Database → Connection string)
DATABASE_URL=postgresql://team22:team22@localhost:5432/team22

# --- Anthropic ---
ANTHROPIC_API_KEY=sk-ant-...                # key del cliente; el proxy la usa para forward
ANTHROPIC_UPSTREAM_URL=https://api.anthropic.com

# --- Embeddings (reglas NL + AI Suggestor) ---
EMBEDDING_PROVIDER=openai                   # openai | voyage
OPENAI_API_KEY=sk-...
VOYAGE_API_KEY=                             # solo si EMBEDDING_PROVIDER=voyage

# --- Supabase Auth (solo /admin) ---
# Local: dejar vacíos y usar el bypass de demo (cookie mock).
# Prod : crear proyecto Supabase y pegar las keys de Project Settings → API.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=                  # server-side only

# --- App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEMO_ORG_ID=demo                            # single-tenant hardcoded para hack

# --- AI Suggestor (spec 08, post-hack) ---
SUGGESTOR_MIN_EVENTS=200
SUGGESTOR_LOOKBACK_DAYS=3
```

### Scripts pnpm (en `web/package.json`)

```jsonc
{
  "scripts": {
    "dev":            "next dev",
    "build":          "next build",
    "start":          "next start",
    "lint":           "next lint",
    "typecheck":      "tsc --noEmit",

    "db:up":          "docker compose -f ../docker-compose.yml up -d",
    "db:down":        "docker compose -f ../docker-compose.yml down",
    "db:migrate":     "prisma migrate deploy",      // aplica migrations existentes (no interactivo)
    "db:migrate:dev": "prisma migrate dev",         // crea nuevas migrations (puede pedir input)
    "db:reset":       "prisma migrate reset",
    "db:studio":      "prisma studio",
    "db:generate":    "prisma generate",

    "seed:vdb":       "tsx scripts/seed-vdb.ts",
    "suggestor:run":  "tsx scripts/run-suggestor.ts",

    "test":           "vitest run"
  }
}
```

### Documentación del proxy (`docs/api.md` — extracto)

````markdown
## POST /v1/messages

Endpoint compatible con la **Anthropic Messages API**. Reenvía a `api.anthropic.com` con cascada de detección.

### Configurar Claude Code para usar el proxy

```bash
export ANTHROPIC_BASE_URL=https://proxy.team22.dev
export ANTHROPIC_API_KEY=sk-ant-...           # tu key real, el proxy la usa para forward
export TEAM22_ORG_KEY=org_demo                 # opcional, si el proxy soporta multi-tenant
```

A partir de ahí cualquier comando `claude ...` pasa por el proxy.

### Request

| Campo | Tipo | Required | Notas |
|---|---|---|---|
| `model` | string | yes | ej. `claude-sonnet-4-6`, `claude-opus-4-7`, `claude-haiku-4-5` |
| `messages` | Message[] | yes | shape Anthropic estándar |
| `system` | string \| Block[] | no | shape Anthropic estándar |
| `max_tokens` | int | yes | shape Anthropic estándar |
| ... | | | resto pasa transparente |

Headers:

| Header | Required | Notas |
|---|---|---|
| `x-api-key` | yes | API key Anthropic del cliente; passthrough |
| `x-team22-org-key` | no | identifica la org; default `DEMO_ORG_ID` |
| `anthropic-version` | yes | passthrough |

### Response 200

Devuelve el shape estándar de Anthropic + dos headers diagnósticos:

| Header | Significado |
|---|---|
| `x-team22-trace-id` | ULID del evento, búscalo en `intercept_events` |
| `x-team22-action` | `BLOCK` \| `REDACT` \| `WARN` \| `LOG` |

Cuando `action = BLOCK`, el body es un `Message` sintético con `stop_reason: "team22_blocked"` y un único content block `text` explicando la política violada en español.

### Errores

| Código | Significado | Body |
|---|---|---|
| 400 | Body no es Messages API válido | `{type:"error", error:{type:"invalid_request_error", message:"..."}}` |
| 401 | Falta `x-api-key` | shape Anthropic estándar |

> El proxy no devuelve 5xx al caller. Si algo explota internamente, hace fail-closed: deja pasar el request con `action=WARN` y loggea la falla.

### Ejemplo curl

```bash
curl -X POST $ANTHROPIC_BASE_URL/v1/messages \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-haiku-4-5",
    "max_tokens": 256,
    "messages": [{"role": "user", "content": "Acá va mi AKIAIOSFODNN7EXAMPLE"}]
  }'
```
````

### Runbook (esqueleto de `docs/runbook.md`)

Mínimo 5 escenarios:

1. **`pnpm seed:vdb` falla con `extension "vector" does not exist`** → habilitar manualmente desde dashboard Supabase.
2. **Claude Code devuelve 401** → revisar que `ANTHROPIC_API_KEY` está exportada y que el proxy la está pasando al upstream (no la tira al recibir).
3. **El proxy siempre devuelve `WARN` con `reason: "haiku_unavailable"`** → revisar `ANTHROPIC_API_KEY` y consola server. Es fail-closed.
4. **VDB devuelve 0 hits** → re-correr seed; verificar que `EMBEDDING_PROVIDER` coincide entre seed y runtime (no se puede mezclar embeddings de proveedores distintos sin re-embed full).
5. **`/admin/events` no muestra cambios en vivo** → revisar que Supabase Realtime está habilitado en el proyecto y que la tabla `intercept_events` está en la publication.
6. **Demo en vivo con internet inestable** → fallback a `pitch/backup.mp4`.

---

## Data model

N/A — este spec es solo documentación.

## Dependencias

- **Spec `00-constitution.md`** — stack y convenciones definidas.
- **Spec `01-engine-interceptor.md`** — fuente del shape del proxy.
- **Spec `02-vdb-bootstrap.md`** — fuente de los scripts seed.
- **Spec `08-ai-suggestor.md`** — env vars del Suggestor.

## Tasks (paralelizables)

- [ ] **T1** — `.env.example` completo en root con todas las vars del bloque arriba. Done: copiar a `.env.local` y `pnpm dev` no se queja por env faltantes.
- [ ] **T2** — `README.dev.md` técnico. Secciones Prerequisites / Setup / Scripts / Estructura. Done: dev fuera del team lo lee y puede levantarlo.
- [ ] **T3** — `docs/api.md` con shape, errores, curl ejemplo y bloque "Cómo configurar Claude Code". Done: copiar el curl, correr, funciona.
- [ ] **T4** — `docs/runbook.md` con 5+ escenarios reales. Done: revisado por al menos 2 del team.
- [ ] **T5** — Actualizar `platanus-hack-project.json` con `project-name`, `project-oneliner-spanish`, `project-description-spanish` definitivos (basados en el hook frase del spec 06). Done: archivo sin placeholders `<FILL THIS>`.
- [ ] **T6** — Reemplazar `project-logo.png` con logo final 1000×1000 < 500 KB. Done: file size verificable.
- [ ] **T7** — (Opcional) `docs/api.openapi.yaml` para devs que quieran generar clients. Done: validar con `npx @stoplight/spectral lint`.

## Verification

- Setup desde cero en máquina limpia: clonar repo, copiar `.env.example` → `.env.local`, llenar valores, `pnpm install && pnpm seed:vdb && pnpm dev` → en 15 min `/admin` funciona y `ANTHROPIC_BASE_URL=http://localhost:3000/api claude "hola"` responde.
- `curl` del ejemplo en `docs/api.md` devuelve respuesta válida.
- Cada escenario de runbook se prueba al menos una vez.
- `cat platanus-hack-project.json` no contiene `<FILL THIS>`.
- `du -h project-logo.png` < 500 KB y `file project-logo.png` reporta 1000×1000.
