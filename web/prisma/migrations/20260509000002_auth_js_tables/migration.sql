-- Auth.js v5 — tablas estándar del Prisma adapter.
-- Ver https://authjs.dev/getting-started/adapters/prisma para el shape canónico.

-- ---- Vínculo opcional members ↔ auth_users ------------------
ALTER TABLE "members" ADD COLUMN "user_id" TEXT;
CREATE UNIQUE INDEX "members_user_id_key" ON "members"("user_id");

-- ---- auth_users ---------------------------------------------
CREATE TABLE "auth_users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "auth_users_email_key" ON "auth_users"("email");

-- ---- auth_accounts ------------------------------------------
CREATE TABLE "auth_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "auth_accounts_provider_provider_account_id_key"
    ON "auth_accounts"("provider", "provider_account_id");

-- ---- auth_sessions ------------------------------------------
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "auth_sessions_session_token_key"
    ON "auth_sessions"("session_token");

-- ---- auth_verification_tokens -------------------------------
CREATE TABLE "auth_verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "auth_verification_tokens_token_key"
    ON "auth_verification_tokens"("token");
CREATE UNIQUE INDEX "auth_verification_tokens_identifier_token_key"
    ON "auth_verification_tokens"("identifier", "token");

-- ---- Foreign keys -------------------------------------------
ALTER TABLE "members"
    ADD CONSTRAINT "members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "auth_users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "auth_accounts"
    ADD CONSTRAINT "auth_accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "auth_users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth_sessions"
    ADD CONSTRAINT "auth_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "auth_users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
