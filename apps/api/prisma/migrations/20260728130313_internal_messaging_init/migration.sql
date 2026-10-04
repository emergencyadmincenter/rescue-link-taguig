-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "image_keys" TEXT[];

-- CreateTable
CREATE TABLE "internal_conversations" (
    "id" UUID NOT NULL,
    "is_group" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_conversation_participants" (
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "internal_conversation_participants_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateTable
CREATE TABLE "internal_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID,
    "text" TEXT,
    "image_keys" TEXT[],
    "reply_to_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "internal_conversation_participants_user_id_idx" ON "internal_conversation_participants"("user_id");

-- CreateIndex
CREATE INDEX "internal_messages_conversation_id_idx" ON "internal_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "internal_messages_created_at_idx" ON "internal_messages"("created_at");

-- AddForeignKey
ALTER TABLE "internal_conversations" ADD CONSTRAINT "internal_conversations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_conversation_participants" ADD CONSTRAINT "internal_conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "internal_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_conversation_participants" ADD CONSTRAINT "internal_conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_messages" ADD CONSTRAINT "internal_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "internal_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_messages" ADD CONSTRAINT "internal_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_messages" ADD CONSTRAINT "internal_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "internal_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
