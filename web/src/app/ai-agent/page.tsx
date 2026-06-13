import type { Metadata } from 'next';
import AiAgentLanding from '@/components/ai-agent/AiAgentLanding';

export const metadata: Metadata = {
  title: 'AI Agent 私有化部署 | 內幕流 Insider Flow',
  description:
    '香港 SME 專用 Private On-Prem AI Agent：Ollama + Open WebUI + 知識庫 RAG，數據唔出公司，PDPO 友好，Docker 一鍵部署。',
  openGraph: {
    title: 'Insider Flow AI Agent — 公司內部 AI，數據唔出門',
    description: '一條 command 部署私有化 AI 助手，適合香港中小企。',
    url: 'https://www.insiderflow.asia/ai-agent',
  },
};

export default function AiAgentPage() {
  return <AiAgentLanding />;
}
