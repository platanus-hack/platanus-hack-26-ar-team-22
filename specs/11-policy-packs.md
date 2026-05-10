# 11 — Policy Packs (Plantillas de políticas curadas)

> **Estado**: backlog / idea. No specceado en detalle aún. Este archivo existe para no perder el contexto de la conversación que originó la feature.

---

## Contexto

Existen repos públicos con "skills" de Claude Code orientadas a seguridad y prompt safety, p. ej.:

- `https://github.com/supercent-io/skills-template` (skill `security-best-practices`)
- `https://github.com/github/awesome-copilot` (skill `ai-prompt-engineering-safety-review`)

El contenido de esas skills (prosa para guiar al modelo) es buen material seed para policies de Tranquera, pero **no son lo mismo**: una skill es client-side y bypasseable; una policy de Tranquera es enforcement en el proxy con `BLOCK | REDACT | WARN | LOG`. La idea es importar el contenido de skills curadas y proyectarlo como bundles de policies reales, **no** distribuir comandos `npx skills add` desde el admin.

## Goals

- El admin ve un catálogo de **Policy Packs** (paquetes temáticos curados por Tranquera): "Security Best Practices", "AI Prompt Safety Review", "PCI-DSS Lite", etc.
- Activa un pack con un toggle. Cada policy del pack queda individualmente on/off y editable como cualquier policy custom.
- Las policies de un pack mantienen referencia a su origen (`pack_id`, `pack_version`) para poder mostrar updates disponibles y auditar qué viene de pack vs custom.
- Default de acciones conservador (LOG/WARN antes que BLOCK) para evitar falsos positivos en onboarding.

## Non-Goals

- **No** llamar a esto "skills" en la UI del admin — la palabra está reservada al concepto de Claude Code y mezclarlas confunde la promesa del producto.
- **No** ejecutar el LLM-extractor que traduce markdown → policy en cada install (la traducción se hace una vez, se versiona y se sirve).
- **No** mezclarlo con la idea de "skill gemela preventiva" (defense-in-depth con prevención client-side derivada de policies). Esa es otra feature.
- **No** marketplace público de packs creados por terceros — al menos no en v1. El catálogo lo cura el equipo Tranquera.

## Open questions

- Modelo de versionado: ¿semver de pack? ¿cómo notificar updates? ¿cómo manejar diffs cuando el admin editó policies del pack localmente?
- Import "power user": además del catálogo curado, ¿permitir pegar URL de skill arbitraria y dejar que el AI Suggestor proponga policies? Útil para clientes con repos internos. Probablemente v2.
- ¿Qué packs lanzamos en v1? Mínimo: Security 101 (secrets/PII), AI Prompt Safety. Posible: PCI-DSS, GDPR Quick Wins.
- ¿Los packs se sirven como datos en DB o como migraciones? Probablemente JSON versionado en repo + seed/import job.

## Dependencias

- Spec `04-admin-web.md` — UI del catálogo y toggles vive acá.
- Spec `08-ai-suggestor.md` — reusable para el camino "import desde URL" (v2).
- Schema de `policies` necesita campos nuevos: `pack_id` (nullable), `pack_version` (nullable).

## Decisión pendiente

Antes de specear tasks: validar con el equipo que esto tiene prioridad post-hack. Es feature de adopción/onboarding, no de demo.
