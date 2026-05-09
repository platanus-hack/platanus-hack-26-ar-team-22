# Specs — Platanus Hack 26 · Team 22

> Spec-Driven Development (SDD) para el firewall de Claude Code corporativo.
> Cada componente vive en su propio `.md`.

---

## Visión rápida

Plataforma de enforcement de políticas de seguridad de datos para asistentes AI corporativos, focalizada en **Claude Code**. Las empresas configuran `ANTHROPIC_BASE_URL` apuntando a nuestro proxy modificable; el proxy aplica reglas no-code en runtime con cascada Regex → Pattern → Haiku judge (<200 ms overhead); el admin no técnico arma reglas con un visual builder; un AI Suggestor propone reglas nuevas en base a logs.

Las **4 layers** del producto:

```
Layer 4: AI Suggestor          (spec 08) ───────────────────────┐
Layer 3: Admin Backoffice       (spec 04) — visual rule builder │
Layer 2: Interceptor Engine     (spec 01) — proxy modificable   │
Layer 1: Claude Code (cliente)                                  │
                                                                ▼
       (compliance-ready, regulator-friendly, LATAM-first)
```

---

## Índice

| # | Componente | Archivo | Bloqueadores |
|---|---|---|---|
| 00 | Constitution (principios, stack, convenciones) | [00-constitution.md](./00-constitution.md) | — |
| 01 | Engine / Interceptor (proxy modificable) | [01-engine-interceptor.md](./01-engine-interceptor.md) | 00, 02 |
| 02 | VDB Bootstrap (reglas NL + embeddings) | [02-vdb-bootstrap.md](./02-vdb-bootstrap.md) | 00 |
| 03 | Landing Page | [03-landing-page.md](./03-landing-page.md) | 00 |
| 04 | Admin Web (visual rule builder + dashboards + approval queue) | [04-admin-web.md](./04-admin-web.md) | 00, 01, 02, 08 |
| 06 | Pitch & Demo | [06-pitch-demo.md](./06-pitch-demo.md) | todos |
| 07 | Requirements & Docs técnicos | [07-requirements-docs.md](./07-requirements-docs.md) | 00, 01 |
| 08 | AI Suggestor (Layer 4) | [08-ai-suggestor.md](./08-ai-suggestor.md) | 00, 01, 02 |

> El antiguo spec `05-user-web.md` (playground multi-rol) fue retirado el 2026-05-09. El "user" final del producto es el dev que usa Claude Code real, no un playground separado.

---

## Cómo agarrar una task

1. Abrí el spec del componente que te interesa.
2. Mirá la sección **Tasks** — cada item es ≤ 4 h y tiene su criterio de "done".
3. Creá branch `feature/<spec-id>-<slug>` (ej. `feature/01-proxy-skeleton`).
4. **1 PR ↔ 1 task**. Mencioná en el PR description qué task del spec cerrás.
5. En el PR pegá un mini-checklist de la sección Acceptance Criteria del spec que tu task afecta.

## Reglas para escribir / modificar specs

- **Antes de codear**, si ves que un spec está incompleto o ambiguo, abrí PR al spec primero.
- No mezclar cambios de spec con cambios de código en el mismo PR.
- Si una task tarda más de 4 h, partila — no extiendas el alcance.
- Los specs son fuente de verdad: si el código diverge, el código está mal (o el spec necesita update primero).

## Estado de los specs

Todos los specs están en estado **draft** hasta que arranque el kickoff de implementación. Marcá un spec como **`v1`** cuando todas sus acceptance criteria estén cubiertas por código mergeado a `main`.

## Track del hack

🛡️ **AI Security** — Platanus Hack 26 · Buenos Aires.
Ver `../research/landscape.md` para contexto de mercado (la idea elegida es una variante focalizada en Claude Code corporativo de la **Idea C** del landscape) y `../research/papers.md` para referencias técnicas.
