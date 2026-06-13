/** Standalone AI Agent product site — not coupled to main Insider Flow app config. */

export const AI_AGENT_BRAND = '私域 AI Agent';
export const AI_AGENT_CONTACT_EMAIL = 'hello@insiderflowagent.com';
export const AI_AGENT_INSTALL_CMD =
  'curl -fsSL https://www.insiderflow.asia/ai-agent/install.sh | bash';
export const AI_AGENT_PACKAGE_PATH = '/ai-agent/package.tar.gz';

export function isAiAgentRoute(pathname: string): boolean {
  return pathname === '/ai-agent' || pathname.startsWith('/ai-agent/');
}
