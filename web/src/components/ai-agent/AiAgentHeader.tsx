'use client';

import { AI_AGENT_BRAND, AI_AGENT_PRODUCT } from '@/lib/aiAgentSite';
import DeployButton from '@/components/ai-agent/DeployButton';

export default function AiAgentHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1220]/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm"
            aria-hidden
          >
            AI
          </span>
          <span className="font-bold text-white truncate">{AI_AGENT_PRODUCT}</span>
        </div>
        <DeployButton className="px-4 py-2 text-sm shrink-0" />
      </div>
    </header>
  );
}
