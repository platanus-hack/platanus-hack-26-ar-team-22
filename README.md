<p align="center">
  <img src="./tranquera-mark.png" alt="Tranquera" width="96" />
</p>

<h1 align="center">Tranquera</h1>

<p align="center"><em>Un paso controlado entre la intención y la respuesta.</em></p>

**Tranquera** resuelve el problema de **alineamiento organizacional de agentes AI**: Claude Code está alineado con los valores de Anthropic, pero no con las políticas de la empresa que lo despliega. Tranquera es la capa intermedia que cierra esa brecha — un proxy modificable que aplica reglas no-code en runtime con una cascada **Regex → Pattern → Haiku judge** de menos de 200 ms de overhead, con cuatro acciones explícitas: `BLOCK · REDACT · WARN · LOG`. El compliance officer (no técnico) especifica las políticas en lenguaje natural con un visual builder; el dev usa Claude Code igual que siempre; un AI Suggestor cierra el loop proponiendo nuevas reglas a partir de los patrones que están pasando bajo el radar.

— Track **AI Security** · Platanus Hack 26 · Buenos Aires · Team 22.

---

## Tabla de contenidos

- [Cómo se usa](#cómo-se-usa)
- [Por qué Tranquera](#por-qué-tranquera)
- [Las 4 layers en una imagen](#las-4-layers-en-una-imagen)
- [Las 4 acciones del proxy](#las-4-acciones-del-proxy)
- [Anatomía de un request](#anatomía-de-un-request)
- [Lo más wow](#lo-más-wow)
- [Quick start local](#quick-start-local)
- [Estructura del repo](#estructura-del-repo)
- [Stack canónico](#stack-canónico)
- [Estado actual](#estado-actual)
- [Equipo](#equipo)

---

> **App live**: [`https://tranquera.vercel.app/`](https://tranquera.vercel.app/) — landing pública + back-office del admin.
> **CLI**: `npx tranquera@0.5.0 setup` — onboarding de devs en un comando.

---

## Cómo se usa

### Admin (compliance / security lead)

1. Entrá a [`https://tranquera.vercel.app/admin/login`](https://tranquera.vercel.app/admin/login) y loguea con Google. El primer login crea automáticamente la org y deja al usuario como **admin owner**.
2. En `/admin/team` invitá a tus devs por email — quedan en estado *pendiente* hasta que se loguéen.
3. En `/admin/rules` armá las políticas (regex o lenguaje natural). Cada regla tiene `slug`, `layer`, `action` y un body legible.
4. En `/admin/events` ves cada prompt en tiempo real con atribución, regla matchada y latencia.
5. En `/admin/analytics` ves métricas agregadas de los últimos 7 días — distribución por acción, latencia promedio, top reglas y volumen por hora.
6. En `/admin/suggestions` revisás las reglas que el Suggestor propone (cron diario o "Run now") y aprobás las que tengan sentido.

### Dev

1. Recibís del admin: *"te agregué a la org en Tranquera, corré `npx tranquera setup`"*.
2. Corré el comando — abre el browser, te loguea con Google contra `tranquera.vercel.app`, listo. El CLI escribe `ANTHROPIC_BASE_URL` en el shell rc apropiado (`~/.zshrc`, `~/.bashrc`, `~/.bash_profile` o `~/.config/fish/config.fish`).
3. Reabrí la terminal (o `source` del rc) y usá `claude` como siempre. Cada prompt pasa por la cascada de tu org y queda atribuido a tu cuenta.

```
//  experiencia del dev en una línea
$  npx tranquera setup
$  source ~/.zshrc
$  claude "ayudame a refactorear esto"   # va por la tranquera, pero el dev no lo nota
```

**¿Cómo se desconecta?** Un solo comando deja todo como antes:

```bash
$  npx tranquera logout              # revoca el token + borra ~/.tranquera/config.json + saca el export del rc
$  unset ANTHROPIC_BASE_URL          # solo si la terminal ya estaba abierta (en fish: set -e ANTHROPIC_BASE_URL)
```

Detalle completo y flag `--keep-rc` en [`cli/README.md`](./cli/README.md#cómo-me-desconecto).

---

## Por qué Tranquera

El alineamiento de modelos de lenguaje resuelve el problema a nivel de entrenamiento: cómo lograr que el modelo no produzca respuestas dañinas o fuera de los valores del proveedor. Ese trabajo es fundamental. Pero hay una capa que los proveedores **no pueden resolver solos**: el alineamiento del agente con las políticas de cada organización que lo despliega.

Cuando una empresa pone Claude Code en las máquinas de sus devs, el modelo está alineado con los valores de Anthropic, pero no sabe qué información es confidencial para esa empresa, qué datos son sensibles según las regulaciones locales, ni qué patrones de respuesta están fuera del marco del equipo de seguridad interno. El resultado es una **brecha de alineamiento organizacional**:

- el dev pega sin querer una `AWS_SECRET_ACCESS_KEY`, un `id_rsa`, el contenido de un `.env`,
- el dev pega un nombre de cliente, un path interno, un fragmento de código propietario,
- nadie ve qué se mandó, ni hay forma de mejorar el alineamiento porque no hay datos de lo que está pasando.

Las soluciones existentes son extremos: o **bloqueás Claude Code completo** (y perdés productividad), o **lo dejás suelto** (y la brecha de alineamiento no se cierra nunca).

Tranquera es una aduana silenciosa, siempre encendida, que aplica las reglas de la organización **sin interrumpir el ritmo** de quien escribe, deja **rastro auditable** de cada decisión y **aprende** de los patrones que pasan bajo el radar para cerrar la brecha de alineamiento de forma iterativa.

---

## Las 4 layers en una imagen

```mermaid
flowchart BT
  L1["LAYER 1 · Claude Code (developer machine)<br/>npx tranquera setup → device flow Google →<br/>shell rc con ANTHROPIC_BASE_URL=&lt;proxy&gt;/cli/&lt;token&gt;"]
  L2["LAYER 2 · Interceptor Engine (FastAPI · Python 3.12)<br/>Cascada Regex → Pattern → Haiku · &lt;200 ms p50<br/>Acciones BLOCK · REDACT · WARN · LOG<br/>Atribución por dev via path-based token"]
  L3["LAYER 3 · Admin Backoffice (Next.js 16)<br/>Visual rule builder (no-code)<br/>/admin/events · /rules · /analytics · /team · /suggestions"]
  L4["LAYER 4 · AI Suggestor<br/>Cron diario + manual trigger<br/>Haiku propone reglas a partir de LOGs → approval queue"]

  L1 -->|HTTPS · ANTHROPIC_BASE_URL| L2
  L2 <-->|SQL compartido| L3
  L3 <-->|rules synced ↔ sugerencias| L4
```

Las cuatro layers comparten una sola base de datos (Postgres + `pgvector`). El schema canónico vive en `web/prisma/schema.prisma` — el interceptor lee y escribe ahí pero **no** corre migraciones, así no hay dos fuentes de verdad.

---

## Las 4 acciones del proxy

| Acción | Qué hace | Cuándo se usa |
|---|---|---|
| **BLOCK** | Rechaza el request. Devuelve un `Message` sintético explicando qué política se violó. Claude Code lo muestra como respuesta del modelo. | PII crítica, credenciales, info regulada |
| **REDACT** | Reemplaza partes sensibles con `[REDACTED:tipo]` y reenvía a Anthropic. La respuesta vuelve normal al dev. | Nombres de clientes, paths internos, snippets propietarios |
| **WARN** | Deja pasar tal cual, pero marca el evento y notifica al admin. | Patrones sospechosos no críticos |
| **LOG** | Solo registra. Sirve para baseline antes de promover una regla a un nivel más estricto. | Auditoría, learning, alimento del Suggestor |

Las acciones viajan como literal strings en JSON y en DB (`"BLOCK" | "REDACT" | "WARN" | "LOG"`), uppercase, sin azúcar.

---

## Anatomía de un request

```mermaid
flowchart TB
  Req(["dev escribe en Claude Code<br/>POST /cli/{token}/v1/messages"])
  L1{"Layer 1 · Regex<br/>~5 ms"}
  L2{"Layer 2 · Pattern<br/>~20 ms · roadmap"}
  L3{"Layer 3 · Haiku judge<br/>~150 ms"}
  Decide["acción ganadora<br/>BLOCK ▸ REDACT ▸ WARN ▸ LOG"]

  Block["BLOCK<br/>Message sintético al dev"]
  Redact["REDACT<br/>forward con secrets enmascarados"]
  Warn["WARN<br/>forward + flag en /admin/events"]
  Log["LOG<br/>forward 1:1"]

  Anth[("api.anthropic.com")]
  Resp(["respuesta al dev"])
  DB[("interactions<br/>traceId · org · member · hits · latency")]

  Req --> L1
  L1 -- match --> Decide
  L1 -- no match --> L2
  L2 -- match --> Decide
  L2 -- no match --> L3
  L3 -- hit --> Decide
  L3 -- pass --> Decide

  Decide --> Block
  Decide --> Redact
  Decide --> Warn
  Decide --> Log

  Block --> Resp
  Redact --> Anth
  Warn --> Anth
  Log --> Anth
  Anth --> Resp

  Decide -. persiste .-> DB
```

La cascada **respeta presupuesto**: cuanto más cara la capa, más tarde se invoca, y solo si las baratas no decidieron. La mayoría de prompts se resuelve en regex (~5 ms); solo lo ambiguo paga el costo del LLM.

Cada request escribe una fila en `interactions` con `traceId`, `org_id`, `member_id` (qué dev), prompt redactado, acción, qué reglas matchearon en qué capa, latencia desglosada y status del upstream. Eso es la evidencia auditable.

### Secuencia detallada

```mermaid
sequenceDiagram
    autonumber
    participant CC as Claude Code
    participant Px as Tranquera Proxy
    participant DB as Postgres
    participant H as Haiku 4.5
    participant A as api.anthropic.com

    CC->>Px: POST /cli/{token}/v1/messages
    Px->>DB: resolve token → (member_id, org_id)
    Px->>DB: load active policies (regex + nl)
    Px->>Px: Layer 1 — regex match
    alt regex hit
        Px->>DB: insert interaction (BLOCK/REDACT/WARN/LOG)
        Px-->>CC: synthetic Message o forward redactado
    else no regex hit
        Px->>H: judge(prompt, nl_rules)
        H-->>Px: hits[] con slug + action
        Px->>A: forward original o redactado
        A-->>Px: response
        Px->>DB: insert interaction
        Px-->>CC: response 1:1
    end
```

---

## Lo más wow

### 01 · Cascada con presupuesto, no monolito LLM

La tentación obvia es tirarle el prompt entero a un modelo y preguntar "¿esto está bien?". No escala: agrega ~150 ms a cada request, cuesta plata por prompt, y mete un punto de falla LLM en el camino crítico del dev.

Tranquera aplica el principio **"cascada antes que LLM"**: regex y patrones resuelven el 90 %+ de los casos en milisegundos; el judge LLM solo se invoca cuando los layers baratos no decidieron y hay reglas en lenguaje natural activas. Si el judge falla (timeout, rate limit, error de API) el sistema **fail-open con flag**: deja pasar pero loggea `reason: "haiku_unavailable"` para que el admin no se quede ciego ni el dev parado.

### 02 · Reglas en lenguaje natural, sin saber regex

El admin puede escribir literalmente *"no menciones nombres de clientes en los prompts"* y el judge (Haiku 4.5) la aplica con contexto. Las regex obvias siguen siendo regex (más rápidas, deterministas), pero las reglas blandas — las que requieren juicio — se expresan en español y se versionan como cualquier otra política.

```
//  ejemplo de regla NL — slug: client-names
//  layer: nl
//  action: REDACT
//  body:  "no menciones razones sociales de clientes externos
//          (ACME, Globant, Galicia, etc.) ni sus emails internos"
```

El judge recibe todas las reglas NL activas en una sola call con prompt caching de Anthropic, así el costo marginal por prompt se mantiene bajo. El schema ya tiene columnas `vector(1536)` (Postgres + `pgvector`) listas para que cuando el set de reglas crezca, se filtre por similitud antes de invocar al judge — la mecánica está implementada, el pre-filter por embeddings queda como optimización siguiente (ver `specs/02-vdb-bootstrap.md`).

### 03 · Atribución por dev sin tocar la máquina

Claude Code **no permite inyectar HTTP headers custom** vía configuración. Eso normalmente rompería el modelo "un proxy, muchos devs". Tranquera lo resuelve **bakeando el token del dev en la URL**:

```
ANTHROPIC_BASE_URL = https://proxy.tranquera/cli/tk_rP6VBQJP6KIc...
```

Cuando Claude Code arma su request, prepende `/v1/messages` a esa URL — el path queda `/cli/{token}/v1/messages`. El proxy:

1. extrae el token del path,
2. lo hashea con sha256 y lo busca en `cli_tokens`,
3. resuelve `member_id` + override de `org_id`,
4. atribuye la `interaction` a ese dev sin que la máquina del dev tenga que setear nada.

El onboarding del dev es **un comando**: `npx tranquera setup`. Hace el device flow contra el back-office (login con Google), guarda el token en `~/.tranquera/config.json` y escribe el `export` en el shell rc correcto (zsh, bash, fish).

### 04 · AI Suggestor — alineamiento iterativo

Especificar todas las políticas relevantes upfront es imposible — los límites reales de la organización emergen de observar el comportamiento del agente en uso real. El Suggestor cierra ese ciclo: convierte los logs en especificaciones de alineamiento nuevas, con humano en el loop siempre.

Los primeros días el admin define las reglas obvias: las regex de credenciales, los paths conocidos. Pero los patrones reales de la brecha aparecen agregados, mirando lo que los devs **realmente** escriben.

El Suggestor (Layer 4) cierra ese loop:

```mermaid
flowchart TB
  Logs[("interactions LOG<br/>últimos 7 días · hasta 80 prompts")]
  Haiku["Haiku 4.5 con prompt caching<br/>system: sos un asistente de seguridad…<br/>user: numerated list of redacted prompts"]
  Sug["hasta 5 sugerencias estructuradas<br/>slug · domain · layer · default_action<br/>severity · pattern? · rule · reasoning · match_indices"]
  DB[("rule_suggestions")]
  Queue["/admin/suggestions<br/>approval queue<br/>humano in the loop, siempre"]

  Logs --> Haiku --> Sug --> DB --> Queue
```

El admin recibe *"5 cosas que tus devs siguen pegando que tal vez no deberían"*, con `match_count` retroactivo y razonamiento. El Suggestor **nunca activa reglas por sí solo** — siempre pasa por aprobación.

Está cableado a **Vercel Cron** (`vercel.json` + `/api/cron/suggestor`) corriendo todos los días a las 09:00 UTC, además de un botón "Run now" en el panel del admin. Idempotente — re-correr en la misma ventana no duplica sugerencias activas.

### 05 · Visual rule builder + feed real-time

Toda la UX del back-office está pensada para alguien **sin saber regex**. El builder genera la regla; el admin elige acción; el feed `/admin/events` muestra cada prompt que pasó, con la atribución al dev, el slug de la regla que matcheó y latencia desglosada por capa. Si llega un BLOCK, se ve en segundos.

### 06 · Identidad monocroma como decisión de producto

La marca es deliberadamente monocroma — paper, ink, graphite — sin verdes ni rojos en lo institucional. La razón es producto, no estética: **un sistema de compliance no debería gritar**. La severidad se distingue por jerarquía tipográfica (peso `LOG 400 → BLOCK 700`), iconografía y un único acento funcional para WARN/BLOCK en superficies de monitoreo en vivo.

Esto fija el tono: Tranquera no es alarmista. Es infraestructura.

### 07 · Specs > código, schema único, idempotencia

- Cada componente vive en su propio `.md` en `specs/`. El código no diverge: o se ajusta el código o se actualiza el spec con PR antes de mergear.
- El schema canónico vive en **un solo lugar** (`web/prisma/`). El interceptor Python lee/escribe la misma DB pero no corre migraciones.
- Toda migración y seed es idempotente: re-correr no duplica datos. La column `org_id` ya está en cada tabla — multi-tenancy real es solo activar Row Level Security.

---

## Quick start local

Requiere Docker, Node 20+, pnpm y Python 3.12+ con [`uv`](https://github.com/astral-sh/uv).

```bash
# 1. Postgres + extensión pgvector
docker compose up -d

# 2. Web (admin + landing + device flow del CLI)
cd web
pnpm install
pnpm db:migrate                   # idempotente
pnpm db:seed                      # demo data: 25 policies, 25 interactions, 6 sugerencias
cp .env.example .env.local
# .env.local — GOOGLE_CLIENT_ID/SECRET para Auth.js, o vacío para modo demo local
pnpm dev                          # http://localhost:3000

# 3. Interceptor (otra terminal)
cd interceptor
cp .env.example .env
# .env — ANTHROPIC_JUDGE_API_KEY de console.anthropic.com
uv sync
uv run python scripts/seed_policies.py        # 4 reglas regex de credenciales
uv run uvicorn app.main:app --reload --port 8080

# 4. Probar el proxy con Claude Code
export ANTHROPIC_BASE_URL=http://localhost:8080
claude "AKIAIOSFODNN7EXAMPLE"     # se bloquea por la regla aws-access-key
```

Para el flow real de un dev (CLI con device flow), usá el paquete publicado en npm:

```bash
# Contra el deploy del hack (default si no seteás envs):
npx tranquera setup

# Contra tu instancia local (ajustando back-office y proxy):
TRANQUERA_APP_URL=http://localhost:3000 \
TRANQUERA_PROXY_URL=http://localhost:8080 \
  node cli/bin/tranquera.js setup
```

Más detalle por componente: [`web/README.md`](./web/README.md), [`interceptor/README.md`](./interceptor/README.md), [`cli/README.md`](./cli/README.md).

---

## Estructura del repo

| Carpeta | Qué hay |
|---|---|
| `specs/` | Spec-Driven Development. **Fuente de verdad**. Empezar por [`specs/README.md`](./specs/README.md) y [`specs/00-constitution.md`](./specs/00-constitution.md). |
| `web/` | Next.js 16 + Tailwind 4 + Prisma 7 + Auth.js v5 (Google). Landing pública, back-office del admin y device flow del CLI. |
| `interceptor/` | Python 3.12 + FastAPI. Proxy Layer 2 — recibe `POST /v1/messages` (y `/cli/{token}/v1/messages`), aplica la cascada y reenvía a Anthropic. Comparte la misma DB que `web/`. Deployado en Railway. |
| `cli/` | Paquete npm `tranquera`. Onboarding de devs en un comando. Device flow contra el back-office, guarda token en `~/.tranquera/config.json`. |
| `identidad/` | Sistema de marca. [`identidad/design.md`](./identidad/design.md) es input obligatorio para todo lo que tenga UI o copy. |
| `research/` | Landscape de mercado, papers, datasets. **No tocar** salvo agregar notas. |
| `.claude/`, `.agents/` | Agents y skills compartidos para Claude Code del equipo. |

```
platanus-hack-26-ar-team-22/
├── specs/                # SDD — fuente de verdad
├── identidad/            # marca · paper · ink · graphite
├── research/             # landscape, papers (read-only)
├── web/                  # Layer 3 + Layer 4 trigger
│   ├── prisma/           # schema canónico de toda la plataforma
│   └── src/app/admin/    # /events · /rules · /team · /suggestions
├── interceptor/          # Layer 2 — el proxy
│   └── app/              # main · cascade · cli_auth · nl_layer
├── cli/                  # Layer 1 — onboarding del dev
└── README.md             # este archivo
```

---

## Stack canónico

| Capa | Tech | Por qué |
|---|---|---|
| Judge LLM | **Anthropic Claude Haiku 4.5** | Latencia + costo bajos, prompt caching activo |
| Embeddings (Suggestor) | **OpenAI `text-embedding-3-small`** o **Voyage `voyage-3-lite`** | Free tier suficiente, calidad sobrada para clustering |
| DB | **Postgres 16 + `pgvector`** | Local: `docker compose up`. Prod: Railway / Supabase. Mismo cliente. |
| ORM | **Prisma 7** con `@prisma/adapter-pg` | Tipos generados, migraciones declarativas; vector field con `Unsupported("vector(1536)")` |
| Auth (admin) | **Auth.js v5 + Google OAuth** | Magic-less, sesiones JWT, callback resuelve org |
| Auth (CLI) | **Device flow** custom contra el back-office | El CLI nunca ve credenciales de Google directamente |
| Frontend | **Next.js 16 (App Router)** + **Tailwind v4** + **IBM Plex Sans/Mono** | Standard, deploy directo a Vercel |
| Interceptor | **Python 3.12 + FastAPI + httpx async + SQLModel** | Run-time de larga vida con prompt-cache de Haiku activo |
| Hosting (web) | **Vercel** | Preview por PR, auto-deploy de `main` a prod, **Vercel Cron** para el Suggestor |
| Hosting (interceptor) | **Railway** | Container con runtime persistente, latencia <200 ms p50 |
| Package managers | **pnpm** (web/cli) · **uv** (interceptor) | — |
| Lenguajes | TypeScript estricto en `web/` y `cli/`. Python 3.12 con `mypy` en `interceptor/` | — |

> **Out of stack**: Neo4j / cualquier graph DB, Edge runtime para el proxy (Vercel Functions no aplica — necesitamos runtime persistente), soporte para otros assistants distintos de Claude Code, encriptación custom de logs.

---

## Estado actual

Hack en curso · Buenos Aires · 2026.

### Live deploys

| Servicio | URL | Hosting |
|---|---|---|
| Back-office + landing | https://tranquera.vercel.app | Vercel |
| Proxy (Layer 2) | https://platanus-hack-26-ar-team-22-production.up.railway.app | Railway |
| CLI publicado | `npx tranquera@0.5.0` | npm |

### Status por componente

| Componente | Estado |
|---|---|
| Interceptor — Layer 1 (regex) | shipped — BLOCK + REDACT + LOG/WARN passthrough |
| Interceptor — Layer 2 (pattern) | roadmap (`interceptor/README.md`) |
| Interceptor — Layer 3 (Haiku judge) | shipped — BLOCK + LOG; reglas NL viajan completas, fail-open con flag |
| Atribución por dev (path token) | shipped — `POST /cli/{token}/v1/messages`; el endpoint sin token (`POST /v1/messages`) cierra con 401 para que ningún prompt quede sin atribuir |
| Acción REDACT | shipped (regex layer enmascara y forwardea) |
| Acción WARN | shipped — viaja en `interactions.action`, visible en `/admin/events`. Notif separada (email/slack) → roadmap |
| Admin — `/admin` (home dashboard) | shipped — KPIs del día, paleta de acciones funcionales, links a /events |
| Admin — `/admin/events` | shipped — feed real-time (polling 3s), filtros por acción, atribución por dev |
| Admin — `/admin/rules` | shipped — CRUD reglas regex + NL, toggle activo/inactivo |
| Admin — `/admin/analytics` | shipped — distribución por acción 7d, latencia, top reglas, volumen por hora |
| Admin — `/admin/team` | shipped — invitaciones, roles (`admin`/`dev`), last-seen, revocación de tokens |
| Admin — `/admin/suggestions` | shipped — approval queue + botón "Run now" |
| AI Suggestor | shipped — Vercel Cron diario 09:00 UTC + manual trigger; up to 5 propuestas/run |
| CLI `tranquera` | shipped en npm v0.5.0 — `setup`, `login`, `whoami`, `status`, `logout` |
| Auth.js + Google OAuth | live |
| Multi-tenancy | schema-ready (`org_id` en cada tabla); RLS post-hack |

Roadmap explícito por componente vive en cada sub-README. Specs siguen siendo la fuente de verdad — si el código diverge, el código está mal.

---

## Equipo

- Christian Rojas Rodriguez — [@Christian-Rojas-Rodriguez](https://github.com/Christian-Rojas-Rodriguez)
- Federico Hörl — [@fede-h](https://github.com/fede-h)
- Mauricio Genta — [@5y5F4il](https://github.com/5y5F4il)
- Jaime Aza — [@Jjat00](https://github.com/Jjat00)
- Tomás Leonel Degese — [@tomileonel](https://github.com/tomileonel)

```
//  tranquera · platanus hack 26 · team 22
//  un paso controlado entre la intención y la respuesta.
```
