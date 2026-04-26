-- CreateTable
CREATE TABLE "subscription_transition_audits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "event_key" TEXT,
    "event_type" TEXT,
    "decision_reason" TEXT NOT NULL,
    "applied" BOOLEAN NOT NULL,
    "previous_membership_tier" TEXT,
    "previous_subscription_status" TEXT,
    "previous_billing_provider" TEXT,
    "previous_expires_at" TIMESTAMP(3),
    "previous_entitlement_id" TEXT,
    "incoming_provider" TEXT NOT NULL,
    "incoming_subscription_status" TEXT NOT NULL,
    "incoming_expires_at" TIMESTAMP(3),
    "incoming_entitlement_id" TEXT,
    "resulting_membership_tier" TEXT,
    "resulting_subscription_status" TEXT,
    "resulting_billing_provider" TEXT,
    "resulting_expires_at" TIMESTAMP(3),
    "resulting_entitlement_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_transition_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_alert_notifications" (
    "id" TEXT NOT NULL,
    "alert_key" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "last_sent_at" TIMESTAMP(3),
    "send_count" INTEGER NOT NULL DEFAULT 0,
    "last_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ops_alert_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscription_transition_audits_user_id_created_at_idx" ON "subscription_transition_audits"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "subscription_transition_audits_created_at_idx" ON "subscription_transition_audits"("created_at" DESC);

-- CreateIndex
CREATE INDEX "subscription_transition_audits_source_created_at_idx" ON "subscription_transition_audits"("source", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ops_alert_notifications_alert_key_key" ON "ops_alert_notifications"("alert_key");

-- CreateIndex
CREATE INDEX "ops_alert_notifications_last_sent_at_idx" ON "ops_alert_notifications"("last_sent_at");

-- AddForeignKey
ALTER TABLE "subscription_transition_audits" ADD CONSTRAINT "subscription_transition_audits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
