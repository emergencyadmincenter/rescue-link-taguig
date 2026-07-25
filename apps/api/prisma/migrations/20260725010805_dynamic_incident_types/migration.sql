/*
  Warnings:

  - You are about to drop the column `incident_type` on the `logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "logs" DROP COLUMN "incident_type",
ADD COLUMN     "incident_category_id" UUID;

-- DropEnum
DROP TYPE "IncidentType";

-- CreateTable
CREATE TABLE "incident_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incident_categories_name_key" ON "incident_categories"("name");

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_incident_category_id_fkey" FOREIGN KEY ("incident_category_id") REFERENCES "incident_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
