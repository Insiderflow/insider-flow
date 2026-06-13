import type { Metadata } from 'next';
import AiAgentLanding from '@/components/ai-agent/AiAgentLanding';
import { AI_AGENT_BRAND, AI_AGENT_PRODUCT } from '@/lib/aiAgentSite';

export const metadata: Metadata = {
  title: `${AI_AGENT_PRODUCT} — 一鍵部署 | ${AI_AGENT_BRAND}`,
  description:
    '香港 SME 免費自助部署公司內部私有 AI 助手：Chat + RAG 知識庫，數據唔出公司。Professional Plan 提供 AI Agent 工作流專人設計。',
  openGraph: {
    title: `${AI_AGENT_PRODUCT} — 似 ChatGPT，數據留喺公司`,
    description: 'Free Plan 一鍵部署 · Professional Plan AI Agent 專人服務',
  },
};

export default function AiAgentPage() {
  return <AiAgentLanding />;
}
