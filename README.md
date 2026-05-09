<img src="./project-logo.png" alt="Tranquera" width="160" align="right" />

# Tranquera

> Un paso controlado entre la intención y la respuesta.

**Tranquera** es el firewall de Claude Code corporativo. Las empresas configuran `ANTHROPIC_BASE_URL` apuntando a un proxy modificable que aplica reglas no-code en runtime con cascada **Regex → Pattern → Haiku judge** (<200 ms overhead) y cuatro acciones: `BLOCK · REDACT · WARN · LOG`. Compliance officers no técnicos arman las reglas con un visual builder; un AI Suggestor propone reglas nuevas en base a logs.

Pensado para empresas LATAM que dan Claude Code a sus devs y necesitan evidencia auditable frente a LGPD, Habeas Data y la regulación IA emergente.

— Track **AI Security** · Platanus Hack 26 · Buenos Aires · Team 22.

---

## Las 4 layers

```
Layer 4: AI Suggestor          (spec 08) ───────────────────────┐
Layer 3: Admin Backoffice       (spec 04) — visual rule builder │
Layer 2: Interceptor Engine     (spec 01) — proxy modificable   │
Layer 1: Claude Code (cliente)                                  │
                                                                ▼
       (compliance-ready, regulator-friendly, LATAM-first)
```

## Repo

| Carpeta | Qué hay |
|---|---|
| `specs/` | Spec-Driven Development. **Fuente de verdad**. Empezá por [`specs/README.md`](./specs/README.md) y [`specs/00-constitution.md`](./specs/00-constitution.md). |
| `web/` | Next.js 16 + Tailwind 4 + Prisma 7. Landing pública, admin web y proxy `/v1/messages`. |
| `identidad/` | Sistema de marca. [`identidad/design.md`](./identidad/design.md) es input obligatorio para todo lo que tenga UI o copy. |
| `research/` | Landscape de mercado, papers y datasets. **No tocar** salvo agregar notas. |
| `.claude/`, `.agents/` | Agents y skills compartidos para Claude Code del equipo. |

## Quick start (local)

Requiere Docker, Node 20+ y pnpm.

```bash
cd web
pnpm install
pnpm db:up           # Postgres con pgvector vía Docker
pnpm db:migrate      # aplica migraciones (idempotente)
pnpm db:generate     # genera el cliente Prisma
pnpm dev             # http://localhost:3000
```

Para demo del proxy vía Claude Code real (ver `specs/06-pitch-demo.md`):

```bash
export ANTHROPIC_BASE_URL=http://localhost:3000
claude "explicame el patrón Observer en TypeScript"
```

## Equipo

- Christian Rojas Rodriguez — [@Christian-Rojas-Rodriguez](https://github.com/Christian-Rojas-Rodriguez)
- Federico Hörl — [@fede-h](https://github.com/fede-h)
- Mauricio Genta — [@5y5F4il](https://github.com/5y5F4il)
- Jaime Aza — [@Jjat00](https://github.com/Jjat00)
- Tomás Leonel Degese — [@tomileonel](https://github.com/tomileonel)
