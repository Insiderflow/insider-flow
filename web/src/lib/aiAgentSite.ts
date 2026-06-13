/** Standalone AI Agent product site — not coupled to main Insider Flow app config. */

export const AI_AGENT_BRAND = '私域 AI';
export const AI_AGENT_PRODUCT = '公司內部私有 AI 助手';
export const AI_AGENT_TAGLINE = '數據永遠唔出公司';
export const AI_AGENT_CONTACT_EMAIL = 'team@insiderflow.asia';
export const AI_AGENT_WHATSAPP_NUMBER = '85264206200';

/** 專人幫手部署（Free Plan 推薦） */
export const AI_AGENT_WHATSAPP_DEPLOY_MESSAGE =
  '你好，我想搵專人幫手部署「公司內部私有 AI 助手」（Free Plan）。';

/** Professional Plan 預約 */
export const AI_AGENT_WHATSAPP_PRO_MESSAGE =
  '你好，我想了解 AI Agent 專業方案（LangGraph / 審批流程），想預約會議。';

export const AI_AGENT_PACKAGE_PATH = '/ai-agent/package.tar.gz';
export const AI_AGENT_INSTALL_SH_PATH = '/ai-agent/install.sh';
export const AI_AGENT_INSTALL_BAT_PATH = '/ai-agent/install.bat';

/** 技術人員用 — 唔會喺網站主界面顯示 */
export const AI_AGENT_INSTALL_CMD =
  'curl -fsSL https://www.insiderflow.asia/ai-agent/install.sh | bash';

export const AI_AGENT_QUESTIONNAIRE_URL =
  process.env.NEXT_PUBLIC_AI_AGENT_QUESTIONNAIRE_URL ??
  `mailto:${AI_AGENT_CONTACT_EMAIL}?subject=${encodeURIComponent('AI Agent 專業服務需求問卷')}&body=${encodeURIComponent('公司名稱：\n聯絡人：\n電話：\n想解決咩問題：\n預算範圍：')}`;

export function getWhatsAppUrl(message: string): string {
  return `https://wa.me/${AI_AGENT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getAiAgentDeployWhatsAppUrl(): string {
  return getWhatsAppUrl(AI_AGENT_WHATSAPP_DEPLOY_MESSAGE);
}

export function getAiAgentProWhatsAppUrl(): string {
  return getWhatsAppUrl(AI_AGENT_WHATSAPP_PRO_MESSAGE);
}

export function isAiAgentRoute(pathname: string): boolean {
  return pathname === '/ai-agent' || pathname.startsWith('/ai-agent/');
}
