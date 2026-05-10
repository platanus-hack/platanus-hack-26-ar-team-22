# web · landing + back-office

Next.js 16 (App Router) + Tailwind 4 + Prisma 7 + Auth.js v5. Sirve dos cosas:

- **Landing pública** (`/`) — el pitch del producto.
- **Back-office del admin** (`/admin/*`) — gestión de reglas, eventos en vivo y team management.
- **Device-flow del CLI** (`/cli/connect`) — el browser-side del onboarding del dev.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (Turbopack) + React 19 |
| Styling | Tailwind v4 (CSS-first) + IBM Plex Sans/Mono |
| ORM | Prisma 7 con `@prisma/adapter-pg` |
| DB | Postgres + `pgvector` (Docker local o Supabase / Railway en prod) |
| Auth | Auth.js v5 (NextAuth) con Google OAuth provider |

## Setup local

Requiere Docker (para Postgres), Node 20+ y pnpm.

```bash
# 1. Postgres + extensión vector
docker compose -f ../docker-compose.yml up -d

# 2. Deps + cliente Prisma + migraciones
pnpm install
pnpm db:migrate          # idempotente

# 3. Variables de entorno
cp .env.example .env.local
# editar .env.local — ver "Auth con Google" más abajo si vas a probar el login real

# 4. Dev server
pnpm dev                 # http://localhost:3000
```

## Modos de auth

El back-office tiene dos modos según las env vars:

### Modo demo (local, sin Google)

Si `GOOGLE_CLIENT_ID` está vacío, el proxy mantiene el shortcut histórico fuera de producción:

- `http://localhost:3000/admin?demo=1` → setea cookie `admin_session=demo` → redirige a `/admin`.
- Todo bajo `org_id=demo` con member mock `admin@team22.dev`.

Útil para arrancar rápido y para la demo del pitch sin tener que loguear.
En producción, si no configurás Google OAuth, el bypass queda cerrado salvo que seteés `ALLOW_DEMO_ADMIN=1` explícitamente para una demo controlada.

### Modo Google (recomendado fuera del pitch)

Pegás credenciales reales en `.env.local`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AUTH_SECRET=...                    # `openssl rand -base64 32`
AUTH_URL=http://localhost:3000     # absolute URL pública
```

Con eso activo:

- `?demo=1` queda desactivado.
- `/admin` redirige a `/admin/login`.
- Click "Continuar con Google" → primer login crea **org nueva con vos como admin** (la lógica vive en `src/lib/org-resolution.ts`).
- Logins posteriores con el mismo email te llevan directo a tu org.
- Si un admin ya te invitó desde `/admin/team`, te asocia al `member` preexistente (con tu rol, dev o admin).

#### Crear el OAuth app en Google Cloud Console

1. <https://console.cloud.google.com/> → proyecto nuevo (o existente).
2. **APIs & Services → OAuth consent screen** → User Type *External* → completá lo mínimo. Status *Testing*.
3. **APIs & Services → Credentials → + Create Credentials → OAuth client ID** → Web application.
   - **Authorized JavaScript origins**: `http://localhost:3000` (+ tu dominio de prod).
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google` (+ idem prod).
4. Copiá Client ID + Secret → `.env.local`.
5. Mientras esté en Testing, agregá tu email en *Test users* del consent screen.

## Estructura

```
web/
├── prisma/
│   ├── schema.prisma            # schema canónico (única fuente de verdad)
│   └── migrations/              # historial de migraciones SQL
├── src/
│   ├── app/
│   │   ├── page.tsx             # landing pública
│   │   ├── admin/
│   │   │   ├── layout.tsx       # shell (sidebar + header + signout)
│   │   │   ├── events/          # feed live con polling 3s
│   │   │   ├── rules/           # CRUD de policies + wizard NL
│   │   │   ├── team/            # invitar/listar devs (admin gate)
│   │   │   ├── login/           # button "Continuar con Google"
│   │   │   └── suggestions/     # cola del AI Suggestor
│   │   ├── api/
│   │   │   ├── admin/           # CRUD endpoints — auth obligatoria
│   │   │   ├── auth/            # NextAuth route handler
│   │   │   └── cli/             # device flow + me + logout
│   │   └── cli/
│   │       └── connect/         # browser side del device flow
│   ├── auth.ts                  # NextAuth full (con Prisma adapter)
│   ├── auth.config.ts           # base config edge-safe (proxy.ts)
│   ├── proxy.ts                 # gating /admin/* y /api/admin/* (modo híbrido)
│   └── lib/
│       ├── prisma.ts            # cliente singleton
│       ├── admin-session.ts     # resolver: Google → orgId/email
│       ├── org-resolution.ts    # auto-crear org / linkear invitación
│       ├── cli-auth.ts          # resuelve Authorization → member
│       └── cli-tokens.ts        # generación + hash de tokens
└── public/                      # assets estáticos
```

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Dev server con Turbopack. |
| `pnpm build` | Build de producción. |
| `pnpm typecheck` | `tsc --noEmit`. |
| `pnpm lint` | ESLint. |
| `pnpm db:up` | Levanta Postgres del docker-compose root. |
| `pnpm db:migrate` | `prisma migrate deploy` (prod-safe, idempotente). |
| `pnpm db:migrate:dev` | `prisma migrate dev` interactivo (genera nuevas migraciones). |
| `pnpm db:reset` | Reset de la DB local. |
| `pnpm db:studio` | Abre Prisma Studio en `http://localhost:5555`. |
| `pnpm db:generate` | Regenera el cliente Prisma. |

## Deploy

Pensado para Vercel — `vercel.json` no requerido, todo es App Router estándar. Variables a setear en producción:

| Var | Notas |
|---|---|
| `DATABASE_URL` | DSN directo a Postgres (Supabase / Railway / Neon). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Mismas que en local pero con `Authorized redirect URI` apuntando al dominio de prod. |
| `AUTH_SECRET` | `openssl rand -base64 32` (uno por entorno). |
| `AUTH_URL` | URL pública del web (ej. `https://tranquera.app`). |
| `ALLOW_DEMO_ADMIN` | Dejar vacío en producción; `1` solo para demos controladas sin Google OAuth. |
| `TRANQUERA_PROXY_URL` | URL del interceptor (Railway). El device-flow `/start` la inyecta en la respuesta al CLI. |
| `CRON_SECRET` | Bearer token para `/api/cron/suggestor`; requerido en producción salvo demo controlada. |
| `ALLOW_UNAUTHENTICATED_CRON` | Dejar vacío en producción; `1` solo para demos controladas sin bearer token. |

Para más contexto del producto, leé el [README del repo](../README.md) y los [specs](../specs/README.md).
