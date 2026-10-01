-- Preserve future Log status transitions and initial statuses.
CREATE TABLE "log_status_history" (
    "id" UUID NOT NULL,
    "log_id" UUID NOT NULL,
    "previous_status" "LogStatus",
    "new_status" "LogStatus" NOT NULL,
    "changed_by_id" UUID,
    "remarks" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "log_status_history_log_id_changed_at_idx" ON "log_status_history"("log_id", "changed_at");
CREATE INDEX "log_status_history_changed_by_id_idx" ON "log_status_history"("changed_by_id");

ALTER TABLE "log_status_history" ADD CONSTRAINT "log_status_history_log_id_fkey"
  FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "log_status_history" ADD CONSTRAINT "log_status_history_changed_by_id_fkey"
  FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;