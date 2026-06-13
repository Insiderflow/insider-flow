import { AI_AGENT_CONTACT_EMAIL } from '@/lib/aiAgentSite';

export type QuestionnaireOption = { id: string; label: string };

export type QuestionnaireQuestion = {
  id: string;
  label: string;
  options: QuestionnaireOption[];
  /** 允許選多項（預設單選） */
  multiple?: boolean;
};

export const AI_AGENT_QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: 'companySize',
    label: '公司大約幾多人？',
    options: [
      { id: '1-10', label: '1–10 人' },
      { id: '11-30', label: '11–30 人' },
      { id: '31-100', label: '31–100 人' },
      { id: '100+', label: '100 人以上' },
    ],
  },
  {
    id: 'primaryGoal',
    label: '最想 AI Agent 幫你解決咩？（可選多項）',
    multiple: true,
    options: [
      { id: 'leave-approval', label: '請假 / 審批流程' },
      { id: 'customer-followup', label: '客戶跟進同回覆' },
      { id: 'hr-onboarding', label: 'HR 政策同新同事 onboarding' },
      { id: 'doc-routing', label: '內部文件整理同分發' },
      { id: 'other', label: '其他（下面備註補充）' },
    ],
  },
  {
    id: 'painPoint',
    label: '而家最花人手、最易出錯嘅係邊部分？（可選多項）',
    multiple: true,
    options: [
      { id: 'repeat-qa', label: 'HR / 前線重複答同一條問題' },
      { id: 'slow-approval', label: '跨部門審批慢' },
      { id: 'scattered-data', label: '資料分散喺 Email、Excel、WhatsApp' },
      { id: 'manual-handoff', label: '同事之間交接靠人手' },
      { id: 'unsure', label: '未確定，想一齊傾' },
    ],
  },
  {
    id: 'budget',
    label: '大概預算範圍？',
    options: [
      { id: 'under-10k', label: 'HK$10,000 以下' },
      { id: '10k-30k', label: 'HK$10,000 – $30,000' },
      { id: '30k-80k', label: 'HK$30,000 – $80,000' },
      { id: '80k+', label: 'HK$80,000 以上' },
      { id: 'discuss', label: '未確定，想先了解' },
    ],
  },
  {
    id: 'timeline',
    label: '希望幾時用到？',
    options: [
      { id: '1m', label: '1 個月內' },
      { id: '1-3m', label: '1–3 個月' },
      { id: '3-6m', label: '3–6 個月' },
      { id: 'exploring', label: '只係了解先' },
    ],
  },
  {
    id: 'itSupport',
    label: '公司有 IT 支援嗎？',
    options: [
      { id: 'inhouse', label: '有專職 IT' },
      { id: 'outsourced', label: '有外判 IT' },
      { id: 'none', label: '冇 IT，老闆 / 行政自己搞' },
      { id: 'unsure', label: '未確定' },
    ],
  },
  {
    id: 'dataHosting',
    label: '公司資料想留喺邊？',
    options: [
      { id: 'own-server', label: '公司自己 server（已有或會買）' },
      { id: 'need-hardware-help', label: '公司 server，需要我哋幫手揀硬件' },
      { id: 'discuss-hosting', label: '未確定，想先傾' },
    ],
  },
];

const QUESTION_IDS = new Set(AI_AGENT_QUESTIONNAIRE_QUESTIONS.map((q) => q.id));

const QUESTION_BY_ID = new Map(AI_AGENT_QUESTIONNAIRE_QUESTIONS.map((q) => [q.id, q]));

const OPTION_MAP = new Map<string, string>(
  AI_AGENT_QUESTIONNAIRE_QUESTIONS.flatMap((q) =>
    q.options.map((o) => [`${q.id}:${o.id}`, o.label] as const),
  ),
);

export type QuestionnaireAnswerValue = string | string[];

export type QuestionnaireAnswers = Record<string, QuestionnaireAnswerValue>;

export type QuestionnaireSubmission = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  answers: QuestionnaireAnswers;
  notes: string;
  website?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function labelForAnswer(questionId: string, optionId: string): string {
  return OPTION_MAP.get(`${questionId}:${optionId}`) ?? optionId;
}

function labelsForQuestionAnswer(questionId: string, value: QuestionnaireAnswerValue): string {
  if (Array.isArray(value)) {
    return value.map((id) => labelForAnswer(questionId, id)).join('、');
  }
  return labelForAnswer(questionId, value);
}

function parseAnswerValue(
  question: QuestionnaireQuestion,
  raw: unknown,
): QuestionnaireAnswerValue | null {
  if (question.multiple) {
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const ids = raw.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
    if (ids.length === 0) return null;
    if (!ids.every((id) => question.options.some((o) => o.id === id))) return null;
    return [...new Set(ids)];
  }

  if (typeof raw !== 'string' || !raw.trim()) return null;
  if (!question.options.some((o) => o.id === raw)) return null;
  return raw;
}

export function validateQuestionnairePayload(
  body: unknown,
):
  | { ok: true; data: QuestionnaireSubmission }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }

  const raw = body as Record<string, unknown>;

  if (typeof raw.website === 'string' && raw.website.trim()) {
    return { ok: true, data: buildSubmission(raw, {}) };
  }

  const companyName = trimStr(raw.companyName, 120);
  const contactName = trimStr(raw.contactName, 80);
  const email = trimStr(raw.email, 200);
  const phone = trimStr(raw.phone ?? '', 40);
  const notes = trimStr(raw.notes ?? '', 2000);

  if (!companyName) return { ok: false, error: '請填寫公司名稱' };
  if (!contactName) return { ok: false, error: '請填寫聯絡人姓名' };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: '請填寫有效電郵地址' };
  }

  const answersRaw = raw.answers;
  if (!answersRaw || typeof answersRaw !== 'object') {
    return { ok: false, error: '請完成所有選擇題' };
  }

  const answers: QuestionnaireAnswers = {};
  for (const q of AI_AGENT_QUESTIONNAIRE_QUESTIONS) {
    const selected = parseAnswerValue(q, (answersRaw as Record<string, unknown>)[q.id]);
    if (selected === null) {
      return {
        ok: false,
        error: q.multiple ? `請至少選一項：${q.label}` : `請選擇：${q.label}`,
      };
    }
    answers[q.id] = selected;
  }

  return {
    ok: true,
    data: buildSubmission(raw, answers, { companyName, contactName, email, phone, notes }),
  };
}

function buildSubmission(
  raw: Record<string, unknown>,
  answers: QuestionnaireAnswers,
  fields?: Partial<QuestionnaireSubmission>,
): QuestionnaireSubmission {
  return {
    companyName: fields?.companyName ?? trimStr(raw.companyName, 120),
    contactName: fields?.contactName ?? trimStr(raw.contactName, 80),
    email: fields?.email ?? trimStr(raw.email, 200),
    phone: fields?.phone ?? trimStr(raw.phone ?? '', 40),
    notes: fields?.notes ?? trimStr(raw.notes ?? '', 2000),
    answers,
    website: typeof raw.website === 'string' ? raw.website : '',
  };
}

function trimStr(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function formatQuestionnaireEmailHtml(data: QuestionnaireSubmission): string {
  const rows = AI_AGENT_QUESTIONNAIRE_QUESTIONS.map((q) => {
    const answerLabel = labelsForQuestionAnswer(q.id, data.answers[q.id] ?? '');
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;width:38%;vertical-align:top;">${escapeHtml(q.label)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#111827;font-weight:600;">${escapeHtml(answerLabel)}</td>
      </tr>`;
  }).join('');

  const notesBlock = data.notes
    ? `<p style="margin:16px 0 0;"><strong>備註：</strong><br/>${escapeHtml(data.notes).replace(/\n/g, '<br/>')}</p>`
    : '';

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
      <h2 style="margin:0 0 8px;">AI Agent 專業方案 — 新問卷提交</h2>
      <p style="margin:0 0 20px;color:#6b7280;">提交時間：${escapeHtml(new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' }))}</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;width:38%;">公司名稱</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${escapeHtml(data.companyName)}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">聯絡人</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${escapeHtml(data.contactName)}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#374151;">電郵</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#374151;">電話</td>
          <td style="padding:10px 12px;">${escapeHtml(data.phone || '—')}</td>
        </tr>
      </table>
      <h3 style="margin:0 0 12px;font-size:16px;">問卷答案</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        ${rows}
      </table>
      ${notesBlock}
    </div>
  `;
}

export function getQuestionnaireRecipientEmail(): string {
  return process.env.AI_AGENT_QUESTIONNAIRE_TO ?? AI_AGENT_CONTACT_EMAIL;
}

export function isValidQuestionId(id: string): boolean {
  return QUESTION_IDS.has(id);
}

export function isQuestionMultiple(questionId: string): boolean {
  return QUESTION_BY_ID.get(questionId)?.multiple === true;
}

export function formatAnswersForDisplay(answers: QuestionnaireAnswers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of AI_AGENT_QUESTIONNAIRE_QUESTIONS) {
    const value = answers[q.id];
    if (value === undefined) continue;
    out[q.label] = labelsForQuestionAnswer(q.id, value);
  }
  return out;
}
