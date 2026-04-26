-- CreateTable
CREATE TABLE "public"."subscription_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "payload" JSONB,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_events_provider_event_key_key" ON "public"."subscription_events"("provider", "event_key");

-- CreateIndex
CREATE INDEX "subscription_events_provider_status_created_at_idx" ON "public"."subscription_events"("provider", "status", "created_at" DESC);
