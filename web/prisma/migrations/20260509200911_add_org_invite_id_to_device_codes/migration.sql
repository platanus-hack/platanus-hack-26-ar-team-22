-- DropForeignKey
ALTER TABLE "rule_suggestions" DROP CONSTRAINT "rule_suggestions_accepted_policy_id_fkey";

-- AlterTable
ALTER TABLE "cli_device_codes" ADD COLUMN     "org_invite_id" TEXT;

-- AlterTable
ALTER TABLE "cli_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "interactions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "members" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "policies" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "rule_suggestions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "decided_at" SET DATA TYPE TIMESTAMP(3);

-- RenameIndex
ALTER INDEX "interactions_org_action_created_at_idx" RENAME TO "interactions_org_id_action_created_at_idx";

-- RenameIndex
ALTER INDEX "rule_suggestions_org_status_created_idx" RENAME TO "rule_suggestions_org_id_status_created_at_idx";
