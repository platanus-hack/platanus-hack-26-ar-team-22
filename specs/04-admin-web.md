# 04 — Admin Web

> Layer 3. Back-office para admins **no técnicos**. Visual rule builder no-code + dashboards + approval queue de reglas auto-sugeridas.

---

## Contexto

El producto se vende a empresas que dan Claude Code a sus devs. La persona que **configura las reglas** es típicamente un compliance officer / security lead — no un dev. Por lo tanto el admin debe:

1. Permitir crear reglas con un **rule builder visual** (no escribir regex a mano, no tocar SQL).
2. Mostrar **eventos en tiempo real** del proxy (qué bloqueó, qué redactó, cuál fue el motivo).
3. Mostrar **what-if reports** ("si activabas esta regla la semana pasada, hubieras bloqueado X requests con riesgo Y").
4. Tener una **approval queue** para reglas que el AI Suggestor (spec 08) propone después de N días.
5. Multi-tenant by design: una org, su set de reglas, sus admins, sus eventos. Para el hack se permite single-tenant hardcoded (`org_id = 'demo'`) pero el schema y los queries deben estar listos para la migración.

Sin admin web, no se pueden modificar reglas sin meterse a SQL. Para la demo es **clave** mostrar: "miren, agrego una regla acá y al toque el interceptor la usa".

---

## Goals

- 4 secciones: **Dashboard**, **Rules** (visual builder + lista), **Events** (live feed), **Suggestions** (approval queue del AI Suggestor).
- Visual rule builder con 3 tipos de regla:
  - **Match exacto / regex preset**: el admin elige de una galería (`AWS Access Key`, `Email`, `Tarjeta de crédito`, ...) — la regex vive escondida.
  - **Filename / path** (Layer 2): admin elige "archivos terminados en .env / id_rsa / *.pem".
  - **En lenguaje natural** (Layer 3): admin escribe "no menciones nombres de clientes" — se embebe y va a `policies.layer='nl'`.
- CRUD completo: crear / listar / editar / habilitar-deshabilitar / eliminar.
- Cambios de reglas se reflejan en el proxy en menos de 5 s (en prod: Supabase Realtime sobre `policies`; en local: polling 5 s).
- Dashboard con 4 KPIs y gráfico de la última hora.
- Approval queue muestra reglas sugeridas por el Layer 4 con preview ("hubiera matcheado N requests, ejemplos: ...") y permite Aceptar / Rechazar / Editar antes de aceptar.

## Non-Goals

- No auth real con SSO (Supabase Auth con magic link mock está OK).
- No bulk import / CSV upload de reglas.
- No audit log visual de cambios al admin (se ve en Supabase directo).
- No edición técnica de regex crudas (escondidas detrás de presets); si un admin quiere regex custom abrimos issue post-hack.

---

## User Stories

- **Como compliance officer**, quiero loguearme y ver cuántos prompts se bloquearon hoy, sin saber programar.
- **Como rule owner**, quiero crear una regla "redactar nombres de clientes" en 30 s desde una UI visual.
- **Como compliance officer**, quiero revisar la cola de reglas sugeridas y aceptar la que tiene más sentido con un click.
- **Como demo runner**, quiero que el panel se vea limpio y profesional para el pitch.

---

## Acceptance Criteria

- [ ] Login en `/admin` con magic link mock (cualquier email + código `123456` hardcodeado).
- [ ] `/admin/dashboard` muestra 4 KPIs: total events 24h, % BLOCK, % REDACT, latencia p50 del proxy.
- [ ] `/admin/dashboard` muestra gráfico de barras con acciones de los últimos 100 events.
- [ ] `/admin/rules` lista todas las reglas con `slug`, `layer`, `category`, `default_action`, toggle on/off.
- [ ] Crear regla con el wizard visual (3 tipos arriba) → upsert en `policies` vía Prisma (con re-embedding si es NL). Toast de confirmación.
- [ ] `/admin/events` muestra feed live (Supabase Realtime) con `created_at`, `action` (badge color), `rule_hits[]`, `prompt_redacted` (truncado 200 chars), botón "ver detalle" → modal con todo el evento.
- [ ] `/admin/suggestions` lista propuestas del Layer 4 con preview de matches retroactivos y CTAs Aceptar / Rechazar / Editar.
- [ ] Todas las pantallas funcionan en desktop Chrome 130+.

---

## Interfaces / Contratos

### Rutas

| Ruta | Función |
|---|---|
| `/admin` → redirect | Si no logueado → `/admin/login`, si logueado → `/admin/dashboard` |
| `/admin/login` | Magic link mock |
| `/admin/dashboard` | KPIs + gráfico |
| `/admin/rules` | Tabla de reglas + wizard de creación / edición |
| `/admin/events` | Feed live con filtros por acción |
| `/admin/suggestions` | Approval queue del AI Suggestor |

### API endpoints (Next.js Route Handlers)

```
GET    /api/admin/metrics                       → KPIs últimas 24h
GET    /api/admin/events?limit=100&action=BLOCK → últimos events filtrables
GET    /api/admin/events/:traceId               → detalle de un evento
GET    /api/admin/rules                          → lista
POST   /api/admin/rules                          → crear (re-embed si layer='nl')
PATCH  /api/admin/rules/:id                      → editar
DELETE /api/admin/rules/:id                      → eliminar
GET    /api/admin/suggestions                    → cola de Layer 4
POST   /api/admin/suggestions/:id/accept         → promover a regla activa
POST   /api/admin/suggestions/:id/reject         → descartar (con motivo)
```

Todos protegidos por middleware que valida sesión Supabase mock (cookie `admin_session`) y filtra por `org_id` del usuario logueado.

### Componentes UI clave

> **Identidad**: tipografía (IBM Plex Sans + Mono), paleta base (paper / ink / graphite) y wordmark vienen de [`../identidad/design.md`](../identidad/design.md). Los **acentos de color por acción** (sección "Action colors" abajo) son **funcionales** — el design system los autoriza explícitamente para superficies de monitoreo en vivo (ver `identidad/design.md` § 6, nota de tensión funcional).

- `<KpiCard>` — número grande IBM Plex Sans 600 + delta como caption mono graphite (ver `identidad/design.md` § 6).
- `<ActionsBarChart>` — recharts, 4 barras (BLOCK / REDACT / WARN / LOG) con colores convencionales (rojo / amarillo / naranja / gris).
- `<RuleWizard>` — stepper shadcn con 3 caminos: Preset / Filename / NL.
  - Preset: galería de cards (`AWS Access Key`, `Email`, `JWT`, `Credit Card`, `IBAN`, `CUIT/CUIL`, ...).
  - Filename: input + chips de presets (`.env`, `id_rsa`, `*.pem`).
  - NL: textarea con ejemplos placeholder + botón "Probar contra los últimos 100 events" antes de guardar.
- `<EventsLiveFeed>` — Supabase channel suscrito, agrega filas al top con animación.
- `<SuggestionCard>` — preview con count de matches retroactivos + 3 ejemplos redactados.

### Action colors (consistencia con landing y eventos)

- `BLOCK` → rojo `bg-red-500/10 text-red-600`
- `REDACT` → amarillo `bg-amber-500/10 text-amber-600`
- `WARN` → naranja `bg-orange-500/10 text-orange-600`
- `LOG` → gris `bg-zinc-500/10 text-zinc-600`

---

## Data model

### Supabase

Reusa `policies` (de spec 02), `interactions` (de spec 01) y `rule_suggestions` (de spec 08).

Tablas que vive en este spec — `members` (humanos / entidades por org) + `organizations` (tenant). Ambas se crean en `web/prisma/migrations/`:

```sql
create table organizations (
  id text primary key,                  -- ej. 'demo', 'acme'
  name text not null,
  upstream_api_key_ref text,            -- referencia a Vault / env, no la key cruda
  created_at timestamptz default now()
);

-- Roles:
--   admin → humano que se loguea al back-office. UI completa.
--   dev   → entidad sin UI por ahora. Existe para atribuir interactions
--           del proxy a un dev concreto cuando emitamos API keys del
--           proxy (post-hack). Sus "permisos" se materializan en el
--           comportamiento del proxy, no en una pantalla.
create type member_role as enum ('admin', 'dev');

create table members (
  id         uuid primary key default gen_random_uuid(),
  org_id     text not null default 'demo' references organizations(id),
  email      text not null,
  role       member_role not null default 'admin',
  created_at timestamptz default now(),
  unique (org_id, email)
);

insert into organizations (id, name) values ('demo', 'Org Demo') on conflict do nothing;
insert into members (org_id, email, role)
  values ('demo', 'admin@team22.dev', 'admin')
  on conflict do nothing;
```

> El SQL canónico vive en `web/prisma/migrations/20260509000001_members_and_suggestions/migration.sql`. Acá lo replicamos resumido como referencia.

> **Nota sobre auth real (post-hack)**: cuando integremos Supabase Auth, `members.id` se mapea 1:1 a `auth.users.id` (mismo UUID). Para el hack la auth es mock — magic link con código `123456` hardcodeado, cookie `admin_session` falsa.

---

## Dependencias

- **Spec `00-constitution.md`** — stack.
- **Spec `01-engine-interceptor.md`** — los events vienen de `interactions` que el proxy escribe.
- **Spec `02-vdb-bootstrap.md`** — para que la tabla `policies` y la función `match_policies` ya existan.
- **Spec `08-ai-suggestor.md`** — alimenta la approval queue.

## Tasks (paralelizables)

- [ ] **T1** — Layout admin (`/admin/*`) con sidebar shadcn (Dashboard / Rules / Events / Suggestions), header con email del user logueado y logout. Done: navegación entre las 4 pantallas funciona.
- [ ] **T2** — Login mock con magic link → cookie `admin_session`. Middleware que protege `/admin/*`. Done: ruta protegida redirige a login si no hay cookie.
- [ ] **T3** — `/api/admin/metrics` que agrega de `interactions` filtrado por `org_id`. KPIs: total 24h, %BLOCK, %REDACT, p50 latencia total. Done: curl devuelve JSON con shape esperado.
- [ ] **T4** — `/admin/dashboard` consumiendo T3 con `<KpiCard>` y `<ActionsBarChart>`. Done: pantalla muestra datos reales.
- [ ] **T5** — `/admin/rules` con tabla + `<RuleWizard>` (3 caminos). Re-embedding en NL via Prisma + provider de embeddings server-side. Done: crear regla NL nueva → aparece en `policies` + visible en próximo `match_policies`.
- [ ] **T6** — `/admin/events` con `<EventsLiveFeed>` suscrito a Supabase Realtime. Filtros por action. Done: en otra pestaña dispará un BLOCK desde el proxy → la fila aparece sin refresh.
- [ ] **T7** — `/admin/suggestions` consumiendo `/api/admin/suggestions` + acciones accept/reject/edit. Done: aceptar una sugerencia la convierte en una fila de `policies` con `source='ai-suggestor'`.
- [ ] **T8** — Notificación visual cuando hay un `WARN` event (toast persistente + badge en sidebar). Done: trigger un WARN → aparece en cualquier pantalla del admin.

## Verification

- Login con `admin@team22.dev` + código `123456` → entra al dashboard.
- Crear regla NL `customer-name-mention` con body "no menciones nombres de clientes" → en `psql` la fila aparece con embedding no null.
- Mandar request al proxy con `ANTHROPIC_BASE_URL=$URL` y prompt "el cliente Acme me pidió X" → `REDACT` con `policyHits` que incluye la nueva regla.
- En `/admin/dashboard`, refrescar y ver `% REDACT` subir.
- En `/admin/events`, ver la fila aparecer en vivo (sin refresh) con badge amarillo.
- En `/admin/suggestions`, después de correr el Suggestor (spec 08) ≥ 1 vez, ver al menos 1 propuesta con preview.
