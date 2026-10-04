-- AlterTable
ALTER TABLE "fraud_assessments" ADD COLUMN     "device_uuid" TEXT,
ADD COLUMN     "fingerprint_hash" TEXT;

-- CreateTable
CREATE TABLE "shadow_bans" (
    "id" UUID NOT NULL,
    "device_uuid" TEXT,
    "fingerprint_hash" TEXT,
    "client_ip" TEXT,
    "caller_contact" TEXT,
    "reason" TEXT NOT NULL,
    "unban_reason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shadow_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quarantined_emergency_requests" (
    "id" UUID NOT NULL,
    "original_payload" JSONB NOT NULL,
    "device_uuid" TEXT,
    "fingerprint_hash" TEXT,
    "client_ip" TEXT,
    "resident_latitude" DECIMAL(10,7),
    "resident_longitude" DECIMAL(10,7),
    "communication_method" TEXT,
    "shadow_ban_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quarantined_emergency_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shadow_bans_device_uuid_idx" ON "shadow_bans"("device_uuid");

-- CreateIndex
CREATE INDEX "shadow_bans_fingerprint_hash_idx" ON "shadow_bans"("fingerprint_hash");

-- CreateIndex
CREATE INDEX "shadow_bans_client_ip_idx" ON "shadow_bans"("client_ip");

-- CreateIndex
CREATE INDEX "shadow_bans_active_idx" ON "shadow_bans"("active");

-- CreateIndex
CREATE INDEX "quarantined_emergency_requests_device_uuid_idx" ON "quarantined_emergency_requests"("device_uuid");

-- CreateIndex
CREATE INDEX "quarantined_emergency_requests_fingerprint_hash_idx" ON "quarantined_emergency_requests"("fingerprint_hash");

-- CreateIndex
CREATE INDEX "quarantined_emergency_requests_created_at_idx" ON "quarantined_emergency_requests"("created_at");

-- AddForeignKey
ALTER TABLE "shadow_bans" ADD CONSTRAINT "shadow_bans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
