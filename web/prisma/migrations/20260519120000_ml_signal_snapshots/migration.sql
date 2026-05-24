-- CreateTable
CREATE TABLE "ml_signal_snapshots" (
    "id" TEXT NOT NULL,
    "source_label" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_signal_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ml_signal_snapshots_generated_at_idx" ON "ml_signal_snapshots"("generated_at" DESC);
