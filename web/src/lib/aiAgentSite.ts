/** Standalone AI Agent product site — not coupled to main Insider Flow app config. */

export const AI_AGENT_BRAND = '私域 AI Agent';
export const AI_AGENT_CONTACT_EMAIL = 'team@insiderflow.asia';
export const AI_AGENT_WHATSAPP_NUMBER = '85264206200';
export const AI_AGENT_WHATSAPP_MESSAGE =
  '你好，我想了解私域 AI Agent 專人代部署服務。';
export const AI_AGENT_INSTALL_CMD =
  'curl -fsSL https://www.insiderflow.asia/ai-agent/install.sh | bash';
export const AI_AGENT_PACKAGE_PATH = '/ai-agent/package.tar.gz';

export function getAiAgentWhatsAppUrl(): string {
  const text = encodeURIComponent(AI_AGENT_WHATSAPP_MESSAGE);
  return `https://wa.me/${AI_AGENT_WHATSAPP_NUMBER}?text=${text}`;
}

export function isAiAgentRoute(pathname: string): boolean {
  return pathname === '/ai-agent' || pathname.startsWith('/ai-agent/');
}
