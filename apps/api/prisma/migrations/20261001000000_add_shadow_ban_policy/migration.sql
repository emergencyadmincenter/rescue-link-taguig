-- CreateEnum
CREATE TYPE "ShadowBanViolationCategory" AS ENUM ('fake_rescue_call', 'spam', 'fraudulent_activity', 'abusive_malicious_use', 'other');

-- CreateEnum
CREATE TYPE "ShadowBanSeverity" AS ENUM ('low', 'high', 'critical');

-- AlterTable
ALTER TABLE "shadow_bans"
ADD COLUMN "violation_category" "ShadowBanViolationCategory" NOT NULL DEFAULT 'other',
ADD COLUMN "severity" "ShadowBanSeverity" NOT NULL DEFAULT 'low',
ADD COLUMN "details" TEXT,
ADD COLUMN "unbanned_at" TIMESTAMP(3),
ADD COLUMN "unbanned_by_id" UUID;

-- CreateIndex
CREATE INDEX "shadow_bans_violation_category_idx" ON "shadow_bans"("violation_category");
CREATE INDEX "shadow_bans_severity_idx" ON "shadow_bans"("severity");

-- AddForeignKey
ALTER TABLE "shadow_bans" ADD CONSTRAINT "shadow_bans_unbanned_by_id_fkey" FOREIGN KEY ("unbanned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
