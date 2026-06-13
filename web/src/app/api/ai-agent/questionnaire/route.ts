import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import {
  formatQuestionnaireEmailHtml,
  getQuestionnaireRecipientEmail,
  validateQuestionnairePayload,
} from '@/lib/aiAgentQuestionnaire';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateQuestionnairePayload(body);

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const data = validated.data;

    if (data.website?.trim()) {
      return NextResponse.json({ ok: true });
    }

    const recipient = getQuestionnaireRecipientEmail();
    const subject = `[AI Agent 問卷] ${data.companyName} — ${data.contactName}`;
    const html = formatQuestionnaireEmailHtml(data);

    await sendEmail(recipient, subject, html);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[ai-agent questionnaire]', error);
    return NextResponse.json(
      { error: '提交失敗，請稍後再試或直接 WhatsApp 聯絡我哋。' },
      { status: 500 },
    );
  }
}
