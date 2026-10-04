-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('medical', 'fire', 'flood', 'accident', 'police', 'utility', 'other');

-- AlterTable
ALTER TABLE "logs" ADD COLUMN     "barangay" TEXT,
ADD COLUMN     "incident_type" "IncidentType",
ADD COLUMN     "weather_condition" TEXT;
