import type { Metadata } from 'next';
import AiAgentLanding from '@/components/ai-agent/AiAgentLanding';
import { AI_AGENT_BRAND, AI_AGENT_PRODUCT } from '@/lib/aiAgentSite';

export const metadata: Metadata = {
  title: `公司內部私有 AI 助手 — 數據唔出公司 | ${AI_AGENT_BRAND}`,
  description:
    '似 ChatGPT 但只屬於你公司。律師樓、會計、地產適用。Free Plan 免費自助部署，Paid Plan AI Agent 專業方案。',
  openGraph: {
    title: '似 ChatGPT，但數據永遠留喺公司',
    description: '香港 SME 私有 AI 助手 · 專人幫手部署 · 完全免費試用',
  },
};

export default function AiAgentPage() {
  return <AiAgentLanding />;
}
