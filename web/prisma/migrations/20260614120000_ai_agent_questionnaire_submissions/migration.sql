-- CreateTable
CREATE TABLE "ai_agent_questionnaire_submissions" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "answers" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_agent_questionnaire_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_agent_questionnaire_submissions_created_at_idx" ON "ai_agent_questionnaire_submissions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_agent_questionnaire_submissions_email_idx" ON "ai_agent_questionnaire_submissions"("email");
