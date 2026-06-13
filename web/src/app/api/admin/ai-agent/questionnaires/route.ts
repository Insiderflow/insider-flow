import { NextRequest, NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import {
  AI_AGENT_QUESTIONNAIRE_QUESTIONS,
  formatAnswersForDisplay,
  type QuestionnaireAnswers,
} from '@/lib/aiAgentQuestionnaire';

export async function GET(request: NextRequest) {
  const auth = assertAdminRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || 50);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 200)) : 50;

  const rows = await prisma.aiAgentQuestionnaireSubmission.findMany({
    orderBy: { created_at: 'desc' },
    take: limit,
  });

  return NextResponse.json({
    count: rows.length,
    questions: AI_AGENT_QUESTIONNAIRE_QUESTIONS.map((q) => ({
      id: q.id,
      label: q.label,
      multiple: Boolean(q.multiple),
    })),
    submissions: rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      companyName: row.company_name,
      contactName: row.contact_name,
      email: row.email,
      phone: row.phone,
      notes: row.notes,
      answers: formatAnswersForDisplay(row.answers as QuestionnaireAnswers),
      answersRaw: row.answers,
    })),
  });
}
