-- =============================================================
-- 0002 — members + rule_suggestions
-- Agrega:
--   * members (spec 04) — identidades por org. Role admin (con UI)
--     o dev (sin UI por ahora; entidad para attribution del proxy).
--   * rule_suggestions (spec 08) — cola del AI Suggestor.
-- Idempotente: re-aplicarlo no debe romper.
-- =============================================================

-- 1. Enums nuevos.
DO $$ BEGIN
    CREATE TYPE "MemberRole" AS ENUM ('admin', 'dev');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE "SuggestionStatus" AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Tabla members.
CREATE TABLE IF NOT EXISTS "members" (
    "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
    "org_id"     TEXT         NOT NULL DEFAULT 'demo',
    "email"      TEXT         NOT NULL,
    "role"       "MemberRole" NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "members"
    DROP CONSTRAINT IF EXISTS "members_org_id_fkey";
ALTER TABLE "members"
    ADD  CONSTRAINT "members_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "members_org_id_email_key"
    ON "members" ("org_id", "email");

-- 3. Tabla rule_suggestions.
CREATE TABLE IF NOT EXISTS "rule_suggestions" (
    "id"                    UUID                NOT NULL DEFAULT gen_random_uuid(),
    "org_id"                TEXT                NOT NULL DEFAULT 'demo',
    "proposed_slug"         TEXT                NOT NULL,
    "proposed_domain"       "PolicyDomain"      NOT NULL,
    "proposed_layer"        "PolicyLayer"       NOT NULL,
    "proposed_rule"         TEXT                NOT NULL,
    "proposed_pattern"      TEXT,
    "proposed_match_config" JSONB,
    "proposed_action"       "Action"            NOT NULL,
    "proposed_severity"     "Severity"          NOT NULL DEFAULT 'medium',
    "match_count"           INTEGER             NOT NULL DEFAULT 0,
    "examples"              JSONB               NOT NULL DEFAULT '[]'::jsonb,
    "status"                "SuggestionStatus"  NOT NULL DEFAULT 'pending',
    "reject_reason"         TEXT,
    "accepted_policy_id"    UUID,
    "created_at"            TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    "decided_at"            TIMESTAMPTZ,
    CONSTRAINT "rule_suggestions_pkey"               PRIMARY KEY ("id"),
    CONSTRAINT "rule_suggestions_examples_array"     CHECK (jsonb_typeof(examples) = 'array'),
    CONSTRAINT "rule_suggestions_match_config_obj"
        CHECK (proposed_match_config IS NULL OR jsonb_typeof(proposed_match_config) = 'object'),
    CONSTRAINT "rule_suggestions_match_count_positive"
        CHECK (match_count >= 0)
);

ALTER TABLE "rule_suggestions"
    DROP CONSTRAINT IF EXISTS "rule_suggestions_org_id_fkey";
ALTER TABLE "rule_suggestions"
    ADD  CONSTRAINT "rule_suggestions_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- accepted_policy_id apunta a la fila de policies creada al aceptar la
-- sugerencia. SET NULL para no borrar histórico si la policy luego se
-- elimina.
ALTER TABLE "rule_suggestions"
    DROP CONSTRAINT IF EXISTS "rule_suggestions_accepted_policy_id_fkey";
ALTER TABLE "rule_suggestions"
    ADD  CONSTRAINT "rule_suggestions_accepted_policy_id_fkey"
    FOREIGN KEY ("accepted_policy_id") REFERENCES "policies"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Index para `/admin/suggestions` (filtra status='pending', orden desc).
CREATE INDEX IF NOT EXISTS "rule_suggestions_org_status_created_idx"
    ON "rule_suggestions" ("org_id", "status", "created_at" DESC);

-- 4. Seed mínimo: un admin demo para que la auth mock tenga contra qué
--    chequear el email. La spec 04 dice email cualquiera + código `123456`,
--    pero igual sembramos uno conocido para los acceptance tests.
INSERT INTO "members" ("org_id", "email", "role")
VALUES ('demo', 'admin@team22.dev', 'admin')
ON CONFLICT ("org_id", "email") DO NOTHING;
