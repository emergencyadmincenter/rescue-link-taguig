-- AlterTable
ALTER TABLE "calls" ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7),
ALTER COLUMN "log_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "logs" ADD COLUMN     "channels" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "call_id" UUID,
ALTER COLUMN "log_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "messages_call_id_idx" ON "messages"("call_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
