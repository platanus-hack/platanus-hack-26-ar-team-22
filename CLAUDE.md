# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

Platanus Hack 26 — Buenos Aires, Team 22. Track: **AI Security**.

**Producto**: **Tranquera** — firewall de Claude Code corporativo. Plataforma de enforcement de políticas de seguridad de datos para asistentes AI corporativos. Las empresas configuran `ANTHROPIC_BASE_URL` apuntando al proxy del producto; el proxy aplica reglas no-code en runtime con cascada Regex → Pattern → Haiku judge (<200 ms overhead) y acciones `BLOCK | REDACT | WARN | LOG`. Hay un admin no técnico con visual rule builder y un AI Suggestor que propone reglas nuevas en base a logs.

Tagline canónico: *Un paso controlado entre la intención y la respuesta*.

**Specs son fuente de verdad**. Antes de tocar código en `web/` o `packages/`, leer:

- `specs/00-constitution.md` — visión, principios, stack, las 4 layers.
- `specs/README.md` — índice y dependencias entre specs.
- `identidad/design.md` — paleta, tipografía y voz. Input obligatorio para todo lo que tenga UI o copy.

El repo está organizado:

- `specs/` — Spec-Driven Development. Cada componente en su propio `.md`.
- `identidad/` — sistema de marca de Tranquera (tokens, wordmark, voz).
- `research/` — landscape, papers, datasets. **No tocar** salvo agregar notas explícitas.
- `web/` — Next.js 16 + Tailwind 4 + TS, scaffold para landing + admin + proxy.

Project name y descripción definitivos en `platanus-hack-project.json`.

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
- **Tablas**: `snake_case` plural (`policies`, `interactions`, `members`, `rule_suggestions`).
- **Voz**: prohibido "AI safety", "escudo", "shield", "muralla". Categoría B2B aceptada: "firewall de Claude Code".
- **Out of stack**: Neo4j, Edge runtime, otros assistants distintos de Claude Code.

## Submission Checklist

Antes del submit:

- [x] `platanus-hack-project.json` con `project-name` "Tranquera" + oneliner + descripción.
- [x] `README.md` con descripción del producto.
- [ ] Reemplazar `project-logo.png` con un PNG 1000×1000 < 500 KB que use el wordmark de `identidad/design.md`.
