-- AlterTable
ALTER TABLE "logs" ADD COLUMN     "public_token" TEXT,
ADD COLUMN     "public_token_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "logs_public_token_key" ON "logs"("public_token");
