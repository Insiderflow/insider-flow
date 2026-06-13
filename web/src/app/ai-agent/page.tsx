import type { Metadata } from 'next';
import AiAgentLanding from '@/components/ai-agent/AiAgentLanding';
import { AI_AGENT_BRAND } from '@/lib/aiAgentSite';

export const metadata: Metadata = {
  title: `${AI_AGENT_BRAND} — 公司內部 AI，數據唔出門`,
  description:
    '香港 SME 專用 Private On-Prem AI Agent：Ollama + Open WebUI + 知識庫 RAG，數據唔出公司，PDPO 友好，Docker 一鍵部署。',
  openGraph: {
    title: `${AI_AGENT_BRAND} — 私有化 AI 助手`,
    description: '一條 command 部署私有化 AI 助手，適合香港中小企。',
  },
};

export default function AiAgentPage() {
  return <AiAgentLanding />;
}
