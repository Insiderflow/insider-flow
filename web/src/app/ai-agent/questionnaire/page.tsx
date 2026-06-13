import type { Metadata } from 'next';
import AiAgentQuestionnaireForm from '@/components/ai-agent/AiAgentQuestionnaireForm';
import { AI_AGENT_BRAND } from '@/lib/aiAgentSite';

export const metadata: Metadata = {
  title: `AI Agent 需求問卷 | ${AI_AGENT_BRAND}`,
  description: '填寫 AI Agent 專業方案需求問卷，我哋會跟進並安排會議。',
};

export default function AiAgentQuestionnairePage() {
  return <AiAgentQuestionnaireForm />;
}
