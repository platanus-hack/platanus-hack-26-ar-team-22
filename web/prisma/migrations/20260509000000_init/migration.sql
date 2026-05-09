-- =============================================================
-- 0001 — init
-- Aplica el schema inicial. Incluye los pedazos que Prisma no
-- expresa de forma declarativa (extensión, ivfflat parcial, función
-- match_policies). Si modificás `schema.prisma` después, regenerá
-- la próxima migración con `pnpm prisma migrate dev --create-only`
-- y volvé a sumar los bloques manuales si tocan tablas con `embedding`.
-- =============================================================

-- 1. Extensión pgvector (necesaria antes de crear columnas vector(N)).
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Enums.
CREATE TYPE "Action" AS ENUM ('BLOCK', 'REDACT', 'WARN', 'LOG');
CREATE TYPE "PolicyLayer" AS ENUM ('regex', 'pattern', 'nl');
CREATE TYPE "PolicySource" AS ENUM ('seed', 'admin', 'ai-suggestor');
CREATE TYPE "Severity" AS ENUM ('low', 'medium', 'high');

-- 3. Tablas.

CREATE TABLE "organizations" (
    "id"                     TEXT        NOT NULL,
    "name"                   TEXT        NOT NULL,
    "upstream_api_key_ref"   TEXT,
    "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "policies" (
    "id"             UUID            NOT NULL DEFAULT gen_random_uuid(),
    "org_id"         TEXT            NOT NULL DEFAULT 'demo',
    "slug"           TEXT            NOT NULL,
    "domain"         TEXT            NOT NULL,
    "layer"          "PolicyLayer"   NOT NULL,
    "rule"           TEXT            NOT NULL,
    "pattern"        TEXT,
    "match_config"   JSONB,
    "default_action" "Action"        NOT NULL,
    "severity"       "Severity"      NOT NULL DEFAULT 'medium',
    "embedding"      vector(1536),
    "source"         "PolicySource"  NOT NULL DEFAULT 'seed',
    "is_active"      BOOLEAN         NOT NULL DEFAULT true,
    "created_at"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3)    NOT NULL,
    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interactions" (
    "id"                UUID         NOT NULL DEFAULT gen_random_uuid(),
    "trace_id"          TEXT         NOT NULL,
    "org_id"            TEXT         NOT NULL DEFAULT 'demo',
    "user_id"           UUID,
    "request_model"     TEXT         NOT NULL,
    "prompt"            TEXT         NOT NULL,
    "action"            "Action"     NOT NULL,
    "reason"            TEXT         NOT NULL,
    "policy_hits"       JSONB        NOT NULL DEFAULT '[]'::jsonb,
    "latency_total_ms"  INTEGER      NOT NULL,
    "latency_by_layer"  JSONB        NOT NULL DEFAULT '{}'::jsonb,
    "upstream_status"   INTEGER,
    "embedding"         vector(1536),
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- 4. Foreign keys.

ALTER TABLE "policies"
    ADD CONSTRAINT "policies_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "interactions"
    ADD CONSTRAINT "interactions_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Unique constraints + índices "regulares" (los que Prisma genera).

CREATE UNIQUE INDEX "policies_org_id_slug_key"   ON "policies"     ("org_id", "slug");
CREATE        INDEX "policies_org_id_layer_idx" ON "policies"     ("org_id", "layer");
CREATE UNIQUE INDEX "interactions_trace_id_key"  ON "interactions" ("trace_id");
CREATE        INDEX "interactions_org_id_created_at_idx"
    ON "interactions" ("org_id", "created_at" DESC);
CREATE        INDEX "interactions_action_idx"    ON "interactions" ("action");

-- =============================================================
-- BLOQUE MANUAL — Prisma no genera nada de esto.
-- Mantener al final del archivo, así si re-generás la migración
-- el bloque queda separado y se puede portar fácil.
-- =============================================================

-- 6. Índice IVFFlat parcial sobre policies.embedding (solo para layer='nl' activas).
CREATE INDEX "policies_embedding_idx"
    ON "policies"
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100)
    WHERE layer = 'nl' AND is_active = true;

-- 7. Función match_policies — usada por el Haiku judge (Layer 3 del proxy).
CREATE OR REPLACE FUNCTION match_policies(
    query_embedding vector(1536),
    k               int,
    p_org_id        text
)
RETURNS TABLE (
    policy_id      uuid,
    slug           text,
    domain         text,
    rule           text,
    default_action text,
    severity       text,
    score          float
)
LANGUAGE sql STABLE AS $$
    SELECT id,
           slug,
           domain,
           rule,
           default_action::text,
           severity::text,
           1 - (embedding <=> query_embedding) AS score
    FROM   policies
    WHERE  layer      = 'nl'
      AND  is_active  = true
      AND  org_id     = p_org_id
      AND  embedding IS NOT NULL
    ORDER  BY embedding <=> query_embedding
    LIMIT  k;
$$;

-- 8. Seed de la org demo (idempotente).
INSERT INTO "organizations" ("id", "name")
VALUES ('demo', 'Org Demo')
ON CONFLICT ("id") DO NOTHING;
