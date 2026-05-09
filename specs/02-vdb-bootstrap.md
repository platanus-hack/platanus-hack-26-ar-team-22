# 02 — VDB Bootstrap

> Genera la base de **reglas en lenguaje natural** y los **embeddings** que usan dos consumidores: el **Haiku judge (Layer 3)** del proxy y el **AI Suggestor (Layer 4)**.

---

## Contexto

La cascada del proxy tiene 3 capas. Las primeras dos (Regex y Pattern) son configuradas en el visual rule builder del admin como reglas declarativas — no necesitan VDB.

La **Layer 3 (Haiku judge)** sí: Haiku recibe el prompt + las top-K reglas en lenguaje natural más relevantes a ese prompt. Para que ese match sea bueno, las reglas NL viven en una VDB (`pgvector` sobre Supabase).

Además, la **Layer 4 (AI Suggestor)** necesita embeddings de los prompts redactados de los logs para clusterizar patrones recurrentes y proponer reglas nuevas. Reusamos la misma extensión `pgvector` y el mismo provider de embeddings.

Hoy partimos de cero. Necesitamos un script idempotente que:

1. Habilite `pgvector` en Supabase y cree las tablas `rules`, `rule_examples` e `intercept_events.embedding`.
2. Lea un corpus seed de **reglas NL** desde `seeds/rules-nl/` (markdown con frontmatter).
3. Genere embeddings y popule la tabla `rules` (idempotente por `slug`).
4. Cree la función SQL `match_rules(query_embedding, k, p_org_id)` que el Haiku judge consume vía RPC.

---

## Goals

- Tabla `rules` + extensión `pgvector` instaladas en Supabase.
- Script `pnpm seed:vdb` que carga ≥ 20 reglas NL seed.
- Re-correr el script no duplica reglas (idempotente por `(org_id, slug)`).
- Función `match_rules(embedding, k, org_id)` en Postgres que devuelve top-k filtradas por org con cosine distance.
- Corpus seed cubre ≥ 4 categorías: `credentials`, `pii`, `internal-paths`, `business-policy`.
- Provider de embeddings configurable vía env (`EMBEDDING_PROVIDER=openai|voyage`).

## Non-Goals

- No automatizamos el re-seed continuo desde el back-office (eso vive en spec `04-admin-web.md`).
- No multi-idioma — solo es-AR para el seed inicial.
- No fine-tuning del modelo de embeddings.
- La columna `embedding` de `intercept_events` la pueblan otros componentes (proxy + AI Suggestor), no este seed.

---

## User Stories

- **Como dev** corriendo el repo por primera vez, quiero un solo comando que me deje la VDB lista.
- **Como CI/CD** post-deploy a Vercel, quiero correr el seed sin duplicar datos.
- **Como demo runner**, quiero que el corpus tenga reglas reconocibles que pueda referenciar en el pitch ("acá ven que la regla `customer-name-mention` matcheó").

---

## Acceptance Criteria

- [ ] `seeds/rules-nl/` contiene ≥ 20 archivos `.md` con frontmatter `{slug, category, label, default_action}` y body en español.
- [ ] `pnpm seed:vdb` corre en < 60 s con red estable y termina con exit 0.
- [ ] Re-correr `pnpm seed:vdb` no genera filas duplicadas (verificable con `select count(*) from rules where source = 'seed'`).
- [ ] La función `match_rules(query_embedding vector(1536), k int, p_org_id text)` existe y devuelve `{rule_id, slug, label, category, default_action, score}`.
- [ ] La extensión `vector` está habilitada en Supabase.
- [ ] Provider de embeddings es configurable vía `EMBEDDING_PROVIDER=openai|voyage`.

---

## Interfaces / Contratos

### Estructura de un archivo seed

```markdown
---
slug: customer-name-mention
category: business-policy
label: "Mención de nombre de cliente real en el prompt"
default_action: REDACT
---

Una regla aplica cuando el dev menciona el nombre de un cliente actual de la empresa
en el prompt — ej. "Acme Corp", "Banco Galicia", "Mercado Pago".

Ejemplos que deberían matchear:
- "Necesito refactorear el código que sirve al cliente Acme."
- "El bug que reportó Banco Galicia el viernes..."

Ejemplos que NO deberían matchear:
- "Acme Corp" usado como ejemplo genérico de placeholder en docs.
- Nombres de clientes ficticios o de test.

Cuando esto matchea con score > 0.78, el Haiku judge suele decidir REDACT.
```

### CLI

```bash
pnpm seed:vdb                       # corre seed completo para org 'demo'
pnpm seed:vdb --org=acme            # seed para una org específica
pnpm seed:vdb --only=credentials    # solo categoría
pnpm seed:vdb --dry-run             # imprime acciones sin escribir
```

### Schema Supabase

```sql
create extension if not exists vector;

-- 'rules' contiene reglas de las 3 capas. La discriminación es por 'layer'.
create table rules (
  id uuid primary key default gen_random_uuid(),
  org_id text not null default 'demo',
  slug text not null,
  layer text not null check (layer in ('regex','pattern','nl')),
  category text not null,                   -- credentials | pii | internal-paths | business-policy | ...
  label text not null,
  body text,                                -- texto NL (solo si layer='nl')
  pattern text,                             -- regex literal (solo si layer='regex')
  match_config jsonb,                       -- pattern matching params (solo si layer='pattern')
  default_action text not null check (default_action in ('BLOCK','REDACT','WARN','LOG')),
  embedding vector(1536),                   -- solo si layer='nl'
  source text not null default 'seed',      -- seed | admin | ai-suggestor
  enabled boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (org_id, slug)
);
create index rules_org_layer_idx on rules(org_id, layer) where enabled;
create index rules_embedding_idx on rules using ivfflat (embedding vector_cosine_ops) with (lists = 100)
  where layer = 'nl';

create or replace function match_rules(
  query_embedding vector(1536),
  k int,
  p_org_id text
)
returns table (rule_id uuid, slug text, label text, category text, default_action text, score float)
language sql stable as $$
  select id, slug, label, category, default_action,
         1 - (embedding <=> query_embedding) as score
  from rules
  where layer = 'nl'
    and enabled = true
    and org_id = p_org_id
    and embedding is not null
  order by embedding <=> query_embedding
  limit k;
$$;
```

> El proxy carga las reglas `regex` y `pattern` en memoria al boot vía `select * from rules where org_id = $1 and layer in ('regex','pattern') and enabled`. Las NL solo se consultan vía `match_rules` cuando se llega a Layer 3.

---

## Dependencias

- **Spec `00-constitution.md`** — provider de embeddings, env vars.
- Cuenta Supabase con permisos para `create extension`.
- API key del provider (`OPENAI_API_KEY` o `VOYAGE_API_KEY`).

## Tasks (paralelizables)

- [ ] **T1** — Migración SQL `supabase/migrations/0001_rules.sql` con tabla `rules`, extensión `vector`, índice `ivfflat` y función `match_rules`. Done: `supabase db push` aplica sin error.
- [ ] **T2** — Migración SQL `supabase/migrations/0002_intercept_events.sql` con la tabla del spec 01 (incluye columna opcional `embedding vector(1536)` para el Suggestor). Done: aplica sin error.
- [ ] **T3** — Corpus seed: 20+ archivos `.md` en `seeds/rules-nl/` cubriendo `credentials`, `pii`, `internal-paths`, `business-policy`. Done: `ls seeds/rules-nl/*.md | wc -l` ≥ 20.
- [ ] **T4** — Seed para regex/pattern (no necesitan embedding): archivo `seeds/rules-regex.json` y `seeds/rules-pattern.json` con ≥ 10 reglas combinadas (`aws-access-key`, `gcp-service-account`, `pem-private-key`, `dotenv-paste`, `id_rsa-paste`, etc.). Done: archivos versionados.
- [ ] **T5** — Script `scripts/seed-vdb.ts` que lee los 3 corpus, llama al provider de embeddings (solo NL) y hace upsert por `(org_id, slug)`. Done: corre localmente y popla la tabla.
- [ ] **T6** — Wrapper `--dry-run`, `--only=<category>` y `--org=<org_id>`. Done: `pnpm seed:vdb --dry-run` imprime acciones sin escribir.
- [ ] **T7** — GitHub Action `.github/workflows/seed-on-deploy.yml` que corre el seed después del deploy a Vercel preview/prod. Done: el workflow corre verde en un PR de prueba.
- [ ] **T8** — Documentar en `07-requirements-docs.md` qué env vars hacen falta para correr el seed.

## Verification

- **Local**: `pnpm seed:vdb` → `psql ... -c "select layer, count(*) from rules group by layer"` muestra ≥ 10 regex/pattern + ≥ 20 NL.
- **Idempotencia**: correr seed dos veces seguidas → counts no cambian.
- **Match funciona**: en psql, `select * from match_rules((select embedding from rules where slug='customer-name-mention'), 5, 'demo')` devuelve 5 filas con score descendente y la primera es score ≈ 1.0.
- **Engine integration**: el spec `01` puede llamar `embedAndMatch("decime el cliente Acme", 5)` y recibe `customer-name-mention` en el top-3.
