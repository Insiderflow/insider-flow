/** Standalone AI Agent product site — not coupled to main Insider Flow app config. */

export const AI_AGENT_BRAND = '私域 AI';
export const AI_AGENT_PRODUCT = '公司內部私有 AI 助手';
export const AI_AGENT_CONTACT_EMAIL = 'team@insiderflow.asia';
export const AI_AGENT_WHATSAPP_NUMBER = '85264206200';
export const AI_AGENT_WHATSAPP_MESSAGE =
  '你好，我想預約 AI Agent 專業服務會議（Human-in-the-loop / 客製 workflow）。';
export const AI_AGENT_INSTALL_CMD =
  'curl -fsSL https://www.insiderflow.asia/ai-agent/install.sh | bash';
export const AI_AGENT_PACKAGE_PATH = '/ai-agent/package.tar.gz';

/** 專業服務需求問卷 — 換成你嘅 Google Form link */
export const AI_AGENT_QUESTIONNAIRE_URL =
  process.env.NEXT_PUBLIC_AI_AGENT_QUESTIONNAIRE_URL ??
  `mailto:${AI_AGENT_CONTACT_EMAIL}?subject=${encodeURIComponent('AI Agent 專業服務需求問卷')}&body=${encodeURIComponent('公司名稱：\n聯絡人：\n電話：\n想解決咩問題：\n預算範圍：')}`;

export function getAiAgentWhatsAppUrl(): string {
  const text = encodeURIComponent(AI_AGENT_WHATSAPP_MESSAGE);
  return `https://wa.me/${AI_AGENT_WHATSAPP_NUMBER}?text=${text}`;
}

export function isAiAgentRoute(pathname: string): boolean {
  return pathname === '/ai-agent' || pathname.startsWith('/ai-agent/');
}
