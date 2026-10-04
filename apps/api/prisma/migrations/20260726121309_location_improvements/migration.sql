-- AlterTable
ALTER TABLE "calls" ADD COLUMN     "location_accuracy" DECIMAL(10,2),
ADD COLUMN     "location_status" TEXT,
ADD COLUMN     "location_timestamp" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "logs" ADD COLUMN     "location_accuracy" DECIMAL(10,2),
ADD COLUMN     "location_status" TEXT,
ADD COLUMN     "location_timestamp" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "quarantined_emergency_requests" ADD COLUMN     "location_accuracy" DECIMAL(10,2),
ADD COLUMN     "location_status" TEXT,
ADD COLUMN     "location_timestamp" TIMESTAMP(3);
