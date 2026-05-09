# 08 — AI Suggestor (Layer 4)

> Job batch que después de N días de uso analiza los logs del proxy y propone reglas nuevas al admin.

---

## Contexto

El Layer 4 es el que **convierte la plataforma de reactiva a proactiva**. La premisa: durante los primeros días el admin configura unas pocas reglas obvias (regex de credenciales, paths conocidos). Pero los patrones reales de filtración aparecen cuando se observan los prompts de los devs reales, agregados.

El Suggestor:

1. Toma los `intercept_events` de la org de los últimos `SUGGESTOR_LOOKBACK_DAYS` (default 3).
2. Filtra los que pasaron como `LOG` (no fueron bloqueados/redactados — la matriz de "lo que estuvo pasando bajo el radar").
3. Embebe los prompts redactados (la columna `intercept_events.embedding`) y los **clusteriza** (HDBSCAN o kmeans simple si HDBSCAN es overkill para 48h).
4. Para cada cluster representativo (≥ N members), pide a Haiku que proponga:
   - Un `slug` y `label` para la regla.
   - Un `default_action` sugerido (`REDACT` por default si Haiku detecta info sensible, `WARN` si es ambiguo).
   - Una explicación en español rioplatense del patrón.
   - 3 ejemplos de matches retroactivos (`trace_id` + snippet redactado).
5. Inserta en `rule_suggestions` para que el admin lo apruebe en `/admin/suggestions`.

El admin decide. El Suggestor **nunca activa reglas por sí solo**.

---

## Goals

- Job CLI `pnpm suggestor:run --org=<id>` que corre el pipeline completo.
- Escribe a `rule_suggestions` con preview retroactivo (count + 3 ejemplos).
- Idempotente — re-correr no duplica sugerencias activas (dedup por hash del cluster centroid + lookback window).
- Para el hack: corre manualmente, no scheduled. (Cron deja como goal post-hack.)
- Cobertura mínima de demo: en datos seed, genera al menos 1 sugerencia coherente.

## Non-Goals

- No auto-aprobación de reglas (siempre humano in the loop).
- No fine-tuning de Haiku.
- No análisis de respuestas del modelo (solo prompts).
- No clustering en streaming — es batch.
- No multi-org cross-pollination (cada org se analiza con sus propios logs).

---

## User Stories

- **Como compliance officer**, después de 3 días de tener el proxy en LOG mode, quiero recibir una lista de "5 cosas que tus devs siguen pegando que tal vez no deberían" y aceptar las que tengan sentido.
- **Como demo runner**, quiero correr el job en vivo o pre-cargar sugerencias para que el slide del Layer 4 tenga datos reales.

---

## Acceptance Criteria

- [ ] `pnpm suggestor:run --org=demo` lee `intercept_events` de los últimos `SUGGESTOR_LOOKBACK_DAYS` filtrando `action='LOG'`.
- [ ] Si los events tienen `embedding=null`, el job los embebe primero (back-fill).
- [ ] Clustering produce N clusters con ≥ `SUGGESTOR_MIN_CLUSTER_SIZE` members (default 5).
- [ ] Para cada cluster, Haiku devuelve un JSON `{slug, label, default_action, reasoning, suggested_pattern?}`.
- [ ] Inserta en `rule_suggestions` con `preview_matches[]` (3 trace_ids representativos del cluster).
- [ ] Idempotencia: re-correr el job en la misma ventana no inserta duplicados.
- [ ] Endpoint `GET /api/admin/suggestions` (definido en spec 04) lee de esta tabla.

---

## Interfaces / Contratos

### CLI

```bash
pnpm suggestor:run --org=demo
pnpm suggestor:run --org=demo --lookback-days=7 --dry-run
```

### Schema Supabase

```sql
create table rule_suggestions (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  cluster_signature text not null,            -- hash del centroid + ventana, para dedup
  suggested_slug text not null,
  suggested_label text not null,
  suggested_layer text not null check (suggested_layer in ('regex','pattern','nl')),
  suggested_default_action text not null check (suggested_default_action in ('BLOCK','REDACT','WARN','LOG')),
  suggested_pattern text,                     -- regex o pattern, si aplica
  suggested_body text,                        -- texto NL, si layer='nl'
  reasoning text not null,                    -- por qué Haiku propone esto
  preview_matches jsonb not null default '[]', -- [{trace_id, snippet_redacted}]
  match_count int not null default 0,         -- cuántos events hubiera matcheado retroactivamente
  status text not null default 'pending' check (status in ('pending','accepted','rejected','edited')),
  reviewed_by text,                           -- email admin
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique (org_id, cluster_signature)
);
create index rule_suggestions_status_idx on rule_suggestions(org_id, status, created_at desc);
```

### Pipeline interno

```
fetchLogEvents(org, lookbackDays)             -- where action='LOG' and created_at > now() - X
  ↓
backfillEmbeddings(events)                     -- solo los que tienen embedding=null
  ↓
cluster(events.embedding) → Cluster[]          -- HDBSCAN con min_cluster_size=5
  ↓
for each cluster:
  centroid = mean(cluster.embeddings)
  signature = sha256(centroid + lookbackWindow)
  if (existsActive(signature)) skip
  haikuOutput = askHaikuToProposeRule(cluster.sample_prompts)
  insertSuggestion({...haikuOutput, preview: cluster.top3, count: cluster.size})
```

### Prompt template (system block para Haiku, cacheado)

```
Sos un asistente de seguridad de datos. Te paso un cluster de prompts redactados que devs
están enviando a Claude Code (un coding assistant). Estos prompts pasaron sin ser bloqueados
ni redactados — el admin nunca creó una regla específica para ellos.

Tu tarea: si detectás un patrón de información sensible que el admin probablemente quiera
controlar, proponé una regla en JSON. Si no ves un patrón claro, devolvé {skip: true}.

Output schema (JSON estricto):
{
  "skip": boolean,
  "slug": "kebab-case",
  "label": "una línea en español",
  "layer": "regex" | "pattern" | "nl",
  "default_action": "BLOCK" | "REDACT" | "WARN" | "LOG",
  "pattern": "regex literal" | null,
  "body": "texto NL si layer=nl" | null,
  "reasoning": "por qué"
}
```

---

## Dependencias

- **Spec `00-constitution.md`** — stack y env vars.
- **Spec `01-engine-interceptor.md`** — la tabla `intercept_events` debe estar poblada.
- **Spec `02-vdb-bootstrap.md`** — la columna `embedding` y el provider configurado.
- **Spec `04-admin-web.md`** — la approval queue lee de `rule_suggestions`.

## Tasks (paralelizables)

- [ ] **T1** — Migración SQL `supabase/migrations/0003_rule_suggestions.sql`. Done: aplica sin error.
- [ ] **T2** — `scripts/run-suggestor.ts` con CLI args (`--org`, `--lookback-days`, `--dry-run`). Done: imprime el plan en `--dry-run`.
- [ ] **T3** — Backfill de embeddings de `intercept_events` con embedding null. Done: `select count(*) from intercept_events where embedding is null` baja a 0 después de correr.
- [ ] **T4** — Implementación del clustering: empezar con `density-clustering` (HDBSCAN-like en TS) o, si no bancan la deps, kmeans con K determinado por elbow simple. Done: clusters generados con >= 5 members.
- [ ] **T5** — Cliente Haiku con prompt caching del system block. Output parseado contra schema con Zod. Done: dado un cluster mock devuelve un Suggestion válido.
- [ ] **T6** — Upsert en `rule_suggestions` con dedup por `cluster_signature`. Done: re-correr el job no genera duplicados.
- [ ] **T7** — Smoke test: seed de 50 events con 2 patrones obvios → corre el suggestor → genera al menos 2 sugerencias coherentes. Done: assertion en vitest.

## Verification

- **Local**: cargar 50 events en `intercept_events` con `action='LOG'` (mitad de ellos mencionando "cliente XYZ" y la otra mitad benignos) → `pnpm suggestor:run --org=demo` → en `/admin/suggestions` aparece al menos 1 propuesta del tipo "menciones de clientes".
- **Idempotencia**: correr el job dos veces seguidas → count en `rule_suggestions` no cambia.
- **Latencia**: con 200 events y K=5 clusters, el job termina en < 30 s.
- **Calidad**: revisión humana del `reasoning` de Haiku → ≥ 80% de las sugerencias son razonables (no spam).
