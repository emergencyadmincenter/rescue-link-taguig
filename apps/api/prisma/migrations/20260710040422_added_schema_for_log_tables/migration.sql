-- CreateEnum
CREATE TYPE "LogStatus" AS ENUM ('active', 'dispatched', 'resolved', 'cancelled');

-- CreateEnum
CREATE TYPE "LogSource" AS ENUM ('manual', 'voice_call', 'chat');

-- CreateEnum
CREATE TYPE "CommunicationMethod" AS ENUM ('voice', 'chat');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('ringing', 'active', 'ended', 'missed', 'rejected');

-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('resident', 'coordinator', 'system');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'file');

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('responder', 'medical', 'relief', 'utility');

-- CreateTable
CREATE TABLE "logs" (
    "id" UUID NOT NULL,
    "reference_no" TEXT NOT NULL,
    "assigned_coordinator_id" UUID,
    "created_by_coordinator_id" UUID,
    "status" "LogStatus" NOT NULL,
    "source" "LogSource" NOT NULL,
    "caller_name" TEXT,
    "caller_contact" TEXT,
    "address" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "description" TEXT,
    "cancellation_reason" TEXT,
    "last_activity_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resident_visible_until" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_resource_assignments" (
    "log_id" UUID NOT NULL,
    "resource_id" UUID NOT NULL,

    CONSTRAINT "log_resource_assignments_pkey" PRIMARY KEY ("log_id","resource_id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" UUID NOT NULL,
    "log_id" UUID NOT NULL,
    "coordinator_id" UUID,
    "communication_method" "CommunicationMethod" NOT NULL,
    "status" "CallStatus" NOT NULL,
    "rejection_reason" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "log_id" UUID NOT NULL,
    "sender_type" "MessageSenderType" NOT NULL,
    "type" "MessageType" NOT NULL,
    "text" TEXT,
    "attachment_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "logs_reference_no_key" ON "logs"("reference_no");

-- CreateIndex
CREATE INDEX "logs_status_idx" ON "logs"("status");

-- CreateIndex
CREATE INDEX "logs_assigned_coordinator_id_idx" ON "logs"("assigned_coordinator_id");

-- CreateIndex
CREATE INDEX "logs_created_by_coordinator_id_idx" ON "logs"("created_by_coordinator_id");

-- CreateIndex
CREATE INDEX "logs_created_at_idx" ON "logs"("created_at");

-- CreateIndex
CREATE INDEX "logs_source_idx" ON "logs"("source");

-- CreateIndex
CREATE UNIQUE INDEX "resources_name_key" ON "resources"("name");

-- CreateIndex
CREATE INDEX "log_resource_assignments_resource_id_idx" ON "log_resource_assignments"("resource_id");

-- CreateIndex
CREATE INDEX "calls_status_idx" ON "calls"("status");

-- CreateIndex
CREATE INDEX "calls_coordinator_id_idx" ON "calls"("coordinator_id");

-- CreateIndex
CREATE INDEX "calls_log_id_idx" ON "calls"("log_id");

-- CreateIndex
CREATE INDEX "messages_log_id_idx" ON "messages"("log_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_assigned_coordinator_id_fkey" FOREIGN KEY ("assigned_coordinator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_created_by_coordinator_id_fkey" FOREIGN KEY ("created_by_coordinator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_resource_assignments" ADD CONSTRAINT "log_resource_assignments_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_resource_assignments" ADD CONSTRAINT "log_resource_assignments_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_coordinator_id_fkey" FOREIGN KEY ("coordinator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
