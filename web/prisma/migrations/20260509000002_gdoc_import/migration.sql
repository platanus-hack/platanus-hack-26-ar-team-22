-- =============================================================
-- 0003 — Google Docs policy import (spec 09)
-- Agrega:
--   * valor 'google-workspace' al enum PolicySource
--   * columna source_hint en rule_suggestions
-- Idempotente: re-aplicarlo no debe romper.
-- =============================================================

-- 1. Nuevo valor en PolicySource.
--    ADD VALUE IF NOT EXISTS disponible desde Postgres 12.
ALTER TYPE "PolicySource" ADD VALUE IF NOT EXISTS 'google-workspace';

-- 2. Columna source_hint en rule_suggestions.
ALTER TABLE "rule_suggestions"
    ADD COLUMN IF NOT EXISTS "source_hint" TEXT;
