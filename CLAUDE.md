# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

Platanus Hack 26 — Buenos Aires, Team 22. Track: **AI Security**.

**Producto**: plataforma de enforcement de políticas de seguridad de datos para asistentes AI corporativos, focalizada en Claude Code. Las empresas configuran `ANTHROPIC_BASE_URL` apuntando al proxy del producto; el proxy aplica reglas no-code en runtime con cascada Regex → Pattern → Haiku judge (<200 ms overhead) y acciones `BLOCK | REDACT | WARN | LOG`. Hay un admin no técnico con visual rule builder y un AI Suggestor que propone reglas nuevas en base a logs.

**Specs son fuente de verdad**. Antes de tocar código en `web/` o `packages/`, leer:

- `specs/00-constitution.md` — visión, principios, stack, las 4 layers.
- `specs/README.md` — índice y dependencias entre specs.

El repo está organizado:

- `specs/` — Spec-Driven Development. Cada componente en su propio `.md`.
- `research/` — landscape, papers, datasets. **No tocar** salvo agregar notas explícitas.
- `web/` — Next.js 16 + Tailwind 4 + TS, scaffold para landing + admin.

El project name y descripción están en `platanus-hack-project.json` (placeholder; se decide en kickoff).

## Team

- Christian Rojas Rodriguez (@Christian-Rojas-Rodriguez)
- Federico Hörl (@fede-h)
- Mauricio Genta (@5y5F4il)
- Jaime Aza (@Jjat00)
- Tomás Leonel Degese (@tomileonel)

## Convenciones (resumidas)

- **Idioma**: código + comentarios en inglés. Specs, copy de UI, errores user-facing en español rioplatense.
- **Branching**: `feature/<spec-id>-<slug>`. 1 PR ↔ 1 task.
- **Acciones del proxy**: literal strings `"BLOCK" | "REDACT" | "WARN" | "LOG"` (uppercase, viajan así en JSON y en DB).
- **Tablas**: `snake_case` plural (`rules`, `intercept_events`).
- **Out of stack**: Neo4j, Edge runtime, otros assistants distintos de Claude Code.

## Submission Checklist

Antes del submit:

- Llenar `platanus-hack-project.json` con `project-name`, `project-oneliner-spanish`, `project-description-spanish` definitivos (no placeholders `<FILL THIS>`).
- Reemplazar `project-logo.png` con un PNG 1000×1000 < 500 KB.
- Actualizar `README.md` con descripción concisa (sin emojis de banana).
