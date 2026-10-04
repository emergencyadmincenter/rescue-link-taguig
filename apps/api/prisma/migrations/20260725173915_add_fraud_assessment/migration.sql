-- CreateEnum
CREATE TYPE "FraudRiskClassification" AS ENUM ('low_risk', 'high_fraud_risk');

-- CreateTable
CREATE TABLE "fraud_assessments" (
    "id" UUID NOT NULL,
    "log_id" UUID,
    "call_id" UUID,
    "client_ip" TEXT NOT NULL,
    "ip_latitude" DECIMAL(10,7),
    "ip_longitude" DECIMAL(10,7),
    "ip_country" TEXT,
    "ip_region" TEXT,
    "ip_city" TEXT,
    "resident_latitude" DECIMAL(10,7),
    "resident_longitude" DECIMAL(10,7),
    "location_permission_granted" BOOLEAN NOT NULL DEFAULT true,
    "distance_km" DECIMAL(10,2),
    "is_vpn" BOOLEAN NOT NULL DEFAULT false,
    "is_proxy" BOOLEAN NOT NULL DEFAULT false,
    "is_hosting" BOOLEAN NOT NULL DEFAULT false,
    "risk_classification" "FraudRiskClassification" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fraud_assessments_log_id_idx" ON "fraud_assessments"("log_id");

-- CreateIndex
CREATE INDEX "fraud_assessments_call_id_idx" ON "fraud_assessments"("call_id");

-- CreateIndex
CREATE INDEX "fraud_assessments_created_at_idx" ON "fraud_assessments"("created_at");

-- AddForeignKey
ALTER TABLE "fraud_assessments" ADD CONSTRAINT "fraud_assessments_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_assessments" ADD CONSTRAINT "fraud_assessments_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
