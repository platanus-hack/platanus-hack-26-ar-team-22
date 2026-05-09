# 00 — Constitution

> Principios, stack y convenciones que **todos los specs heredan**.
> Cualquier excepción a esta constitution se discute en grupo antes de codear.

---

## Visión del producto

Construir una **plataforma de enforcement de políticas de seguridad de datos para asistentes AI corporativos**, focalizada en **Claude Code**. Una empresa instala Claude Code en las máquinas de sus devs y configura `ANTHROPIC_BASE_URL` apuntando a nuestro interceptor. Desde ese momento:

1. Cada request de Claude Code pasa por el **proxy** (Layer 2), que es **modificable**: puede dejar pasar, redactar, bloquear o solo loggear.
2. **Admins no técnicos** definen reglas con un **visual rule builder** en el back-office (Layer 3) — sin escribir regex a mano.
3. El proxy aplica las reglas en runtime con una **cascada en 3 capas** (Regex → Pattern → Haiku judge) que mantiene **<200 ms de overhead** sobre el round-trip a Anthropic.
4. Después de N días de uso, un **AI Suggestor** (Layer 4) detecta patrones recurrentes en los logs y propone nuevas reglas que el admin aprueba o descarta.

Target inicial: **empresas LATAM que dan Claude Code a sus devs y necesitan evidencia auditable de que datos sensibles (PII, credenciales, paths internos, código propietario) no están saliendo en cada prompt** — driver regulatorio: LGPD (Brasil), Habeas Data (Argentina), LFPDPPP (México). Ver `research/landscape.md` § Idea C.

---

## Las 4 capas

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4 — AI Suggestor                                     │
│  Después de N días, sugiere reglas nuevas a partir de logs. │
│  Approval queue en el admin.  (spec 08)                     │
└─────────────────────────────────────────────────────────────┘
                            ▲
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3 — Admin Backoffice (Web UI)                        │
│  - Visual rule builder (no-code)                            │
│  - Dashboards: real-time events, what-if, riesgo evitado    │
│  - User & role management                                   │
│  - Approval queue de reglas auto-sugeridas  (spec 04)       │
└─────────────────────────────────────────────────────────────┘
                            ▲ rules synced
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2 — Interceptor Engine (proxy modificable)           │
│  - Compatible con Anthropic Messages API                    │
│  - Cascada: Regex (~5ms) → Pattern (~20ms) → Haiku (~150ms) │
│  - Acciones: BLOCK / REDACT / WARN / LOG                    │
│  - <200 ms overhead target  (spec 01)                       │
└─────────────────────────────────────────────────────────────┘
                            ▲ HTTPS — ANTHROPIC_BASE_URL
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1 — Claude Code (developer's machine)                │
└─────────────────────────────────────────────────────────────┘
```

## Las 4 acciones del proxy

| Acción | Qué hace | Cuándo se usa |
|---|---|---|
| **BLOCK** | Rechaza el request. Devuelve un `Message` sintético explicando qué política se violó. Claude Code lo muestra como respuesta del modelo. | PII crítica, credenciales, info regulada |
| **REDACT** | Reemplaza partes sensibles con `[REDACTED:tipo]` y reenvía a Anthropic. La respuesta vuelve normal al user. | Nombres de clientes, paths internos, snippets de código propietario |
| **WARN** | Deja pasar tal cual, pero marca el evento y notifica al admin. | Patrones sospechosos no críticos |
| **LOG** | Solo registra. Sirve para baseline antes de promover una regla a un nivel más estricto. | Auditoría, learning |

## Pipeline de detección (cascada)

```
request → [Regex layer ~5ms]
         ├─ match? → action → end
         └─ no match → [Pattern layer ~20ms]
                       ├─ match? → action → end
                       └─ no match → [Haiku judge ~150ms, opcional]
                                     ├─ flag? → action → end
                                     └─ pass → forward to Anthropic
```

- **Capa 1 — Regex** (instantáneo): emails, números de tarjeta, AWS keys, JWTs, etc.
- **Capa 2 — Pattern matching** (rápido): paths sensibles, nombres de archivos comunes (`.env`, `id_rsa`, `secrets.json`).
- **Capa 3 — Haiku judge** (smart): solo cuando el admin define una regla en lenguaje natural ("no menciones nombres de clientes"). Haiku evalúa con contexto. La VDB de reglas NL le da few-shots a Haiku via prompt caching.

---

## Principios (no negociables)

1. **Todo request de Claude Code pasa por el proxy antes de tocar Anthropic.** No hay "bypass para casos urgentes".
2. **Trazabilidad sobre velocidad.** Cada decisión genera un `traceId` con qué reglas matchearon, en qué capa y qué dijo Haiku. Si tenemos que elegir, latencia se sacrifica primero.
3. **Cascada antes que LLM.** No se llama a Haiku si una capa más barata ya decidió. Costo y latencia importan.
4. **Sin PII en logs sin redacción.** Antes de loggear, el prompt se redacta (las mismas regex que las reglas BLOCK/REDACT corren primero en el logger).
5. **Specs > código.** Si el código no coincide con su spec, el código se ajusta o el spec se actualiza con PR — nunca se acepta divergencia silenciosa.
6. **Idempotencia en seeds y migrations.** Re-correr un script no debe duplicar datos.
7. **Demo > documentación bonita.** Para el hack: si una pantalla no se ve en la demo de 3min, no es prioridad.
8. **El admin es no técnico.** Toda UX del back-office debe poder ser usada sin saber regex. La regex queda escondida detrás del rule builder visual.

---

## Stack canónico

| Capa | Tech | Razón |
|---|---|---|
| LLM de juicio | **Anthropic Claude Haiku 4.5** vía SDK oficial | Latencia + costo bajos, prompt caching activo |
| LLM de embeddings | **OpenAI `text-embedding-3-small`** o **Voyage `voyage-3-lite`** | Free tier suficiente para 48h |
| Storage + Vector DB | **Supabase Postgres + extensión `pgvector`** | Auth + storage + vectores + tabla de logs en una cuenta |
| Frontends | **Next.js 16 App Router** + **shadcn/ui** + **Tailwind 4** | Standard, deploy directo a Vercel |
| Hosting | **Vercel** (Functions Node runtime — necesitamos drivers) | Preview por PR para QA paralelo |
| Auth | **Supabase Auth** con magic links — mock OK para el hack | Cero fricción, sin OAuth real |
| Package manager | **pnpm** | Monorepo limpio si dividimos en `apps/` |
| Lenguaje | TypeScript estricto en frontend y backend | — |

> **Out:** Neo4j / cualquier graph DB. La idea original de "grafo de roles + recursos" se reemplaza por reglas declarativas en Postgres + cascada del proxy.

---

## Convenciones

### Idioma
- **Código y comentarios**: inglés.
- **Specs, copy de UI, errores user-facing**: español rioplatense.
- **Nombres de archivos en specs**: `NN-slug-en-ingles.md` (numerados para orden de lectura).

### Branching y PRs
- `main` siempre deployable.
- `feature/<spec-id>-<slug>` — ej. `feature/01-proxy-skeleton`.
- 1 PR ↔ 1 task del spec correspondiente.
- PR description: link al spec y task que cerrás + mini-checklist de acceptance criteria afectados.
- Squash merge.

### Estructura de repo (target)
```
platanus-hack-26-ar-team-22/
├── specs/                    # estos specs
├── research/                 # ya existe, no tocar
├── web/                      # Next.js 16 — landing + admin (single app)
├── packages/
│   ├── interceptor/          # core del proxy (cascada + redactor)
│   ├── db/                   # cliente Supabase
│   └── shared/               # tipos comunes (Action, Rule, InterceptEvent)
├── seeds/                    # corpus inicial de reglas
└── scripts/                  # seed-vdb, etc.
```

> Para el hack arrancamos con `web/` único (ya creado con `create-next-app`). La extracción a `packages/` queda como refactor opcional si sobra tiempo.

### Naming
- Acciones del proxy: literal strings `"BLOCK" | "REDACT" | "WARN" | "LOG"` (uppercase, viajan así en JSON y en DB).
- Tablas Supabase: `snake_case` plural (ej. `rules`, `intercept_events`, `organizations`).
- Componentes React: `PascalCase`. Hooks: `useCamelCase`.

### Variables de entorno
Toda env var nueva se documenta en `07-requirements-docs.md` y `.env.example`. Sin env documentada → no merge.

---

## Multi-tenancy (goal)

El producto es **multi-tenant por diseño**: cada empresa cliente es una `organization` con su propio set de reglas, su propia API key de Anthropic upstream y sus propios admins. El proxy identifica la `org_id` por:

- Header `x-team22-org-key` que el admin configura en el env de Claude Code de cada dev, **o**
- Subdominio del proxy (`<org>.proxy.team22.dev`) si llegamos a configurar DNS.

Para el hack se acepta **single-tenant hardcoded** (`org_id = 'demo'` en env) siempre y cuando el schema de DB ya tenga la columna `org_id` y los queries la filtren — la migración a multi-tenant real debe ser solo configuración, no rewrite.

---

## Out of scope global (no construimos esto en 48h)

- SSO corporativo / SAML / SCIM.
- Streaming responses de Anthropic (solo non-streaming en v1 del proxy).
- Rate limiting avanzado / quotas por dev.
- Métricas de producción (Datadog, Sentry) — usar `console.log` estructurado.
- Tests E2E exhaustivos — solo smoke tests del happy path.
- Internacionalización (solo es-AR).
- Mobile-responsive perfecto (solo desktop para la demo).
- Soporte de otros assistants (Cursor, Cline, etc.) — solo Claude Code.
- Encriptación de logs en reposo más allá de lo que Supabase ofrece por default.

---

## Aún por definir (decidir en kickoff)

- [ ] `project-name` final → actualizar `platanus-hack-project.json`.
- [ ] `project-oneliner-spanish` → idem.
- [ ] Provider de embeddings: OpenAI vs Voyage (decidir en spec `02-vdb-bootstrap.md` cuando se mida latencia).
- [ ] Si el proxy se deploya en Vercel Functions Node runtime o si para latencia <200ms necesitamos un tier dedicado (Fly.io, Railway).
