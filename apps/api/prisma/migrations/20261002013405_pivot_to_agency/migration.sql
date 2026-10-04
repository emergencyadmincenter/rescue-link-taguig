-- CreateEnum
CREATE TYPE "AgencyType" AS ENUM ('fire', 'medical', 'police', 'drrmo', 'other');

-- CreateEnum
CREATE TYPE "CoordinationStatus" AS ENUM ('pending', 'contacted', 'completed');

-- CreateEnum
CREATE TYPE "UpdateSource" AS ENUM ('external', 'internal');

-- CreateTable
CREATE TABLE "agencies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AgencyType" NOT NULL,
    "contact_info" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_incident_categories" (
    "agency_id" UUID NOT NULL,
    "incident_category_id" UUID NOT NULL,

    CONSTRAINT "agency_incident_categories_pkey" PRIMARY KEY ("agency_id","incident_category_id")
);

-- CreateTable
CREATE TABLE "log_agency_coordinations" (
    "id" UUID NOT NULL,
    "log_id" UUID NOT NULL,
    "agency_id" UUID NOT NULL,
    "status" "CoordinationStatus" NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "access_token" TEXT NOT NULL,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "log_agency_coordinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordination_updates" (
    "id" UUID NOT NULL,
    "log_id" UUID NOT NULL,
    "agency_id" UUID,
    "created_by_id" UUID,
    "message" TEXT NOT NULL,
    "source" "UpdateSource" NOT NULL DEFAULT 'external',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coordination_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agencies_name_key" ON "agencies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "log_agency_coordinations_access_token_key" ON "log_agency_coordinations"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "log_agency_coordinations_log_id_agency_id_key" ON "log_agency_coordinations"("log_id", "agency_id");

-- CreateIndex
CREATE INDEX "coordination_updates_log_id_created_at_idx" ON "coordination_updates"("log_id", "created_at");

-- AddForeignKey
ALTER TABLE "agency_incident_categories" ADD CONSTRAINT "agency_incident_categories_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_incident_categories" ADD CONSTRAINT "agency_incident_categories_incident_category_id_fkey" FOREIGN KEY ("incident_category_id") REFERENCES "incident_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_agency_coordinations" ADD CONSTRAINT "log_agency_coordinations_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_agency_coordinations" ADD CONSTRAINT "log_agency_coordinations_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_agency_coordinations" ADD CONSTRAINT "log_agency_coordinations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_updates" ADD CONSTRAINT "coordination_updates_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_updates" ADD CONSTRAINT "coordination_updates_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordination_updates" ADD CONSTRAINT "coordination_updates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
