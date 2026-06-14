'use client';

import Link from 'next/link';
import WhatsAppContactButton from '@/components/ai-agent/WhatsAppContactButton';
import { AI_AGENT_QUESTIONNAIRE_URL } from '@/lib/aiAgentSite';

function IconAgent({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

export default function ProAgentSection() {
  return (
    <section
      id="ai-agent-pro"
      className="scroll-mt-24 rounded-2xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-950/50 via-[#0b1220] to-indigo-950/40 p-8 sm:p-12 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <p className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">Paid Plan · 專業部署</p>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-5">
          <IconAgent className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4">
          需要更強大嘅 AI Agent 嗎？
        </h2>
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl mx-auto">
          Free Plan 夠晒日常問答同查公司文件。
          如果你想 AI <strong className="text-white">幫你處理業務</strong>——例如跟進客戶、整理文件、自動發電郵、請你批完先執行——
          就需要我哋幫你設計 <strong className="text-blue-300">AI Agent</strong>。
        </p>

        <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-5 sm:p-6 text-left mb-8 max-w-lg mx-auto">
          <p className="text-blue-200 font-semibold mb-3">適合你呢類公司：</p>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• 律師樓：合約條款查詢、內部指引、客戶資料要保密</li>
            <li>• 會計樓：報稅流程、內部 SOP、減少同事重複答問題</li>
            <li>• 地產：物業資料、銷售話術、跟進客戶要更快</li>
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-left mb-8 max-w-2xl mx-auto">
          <div className="rounded-xl border border-white/10 bg-gray-900/60 p-5">
            <p className="text-emerald-400 text-xs font-bold mb-2">Free · 自己裝就得</p>
            <p className="text-sm text-gray-400">員工問答、查公司文件、$0 起</p>
          </div>
          <div className="rounded-xl border border-blue-500/40 bg-blue-950/40 p-5">
            <p className="text-blue-300 text-xs font-bold mb-2">Paid · 專人幫你設計</p>
            <p className="text-sm text-gray-300">AI 幫你做事，重要步驟要你批，接電郵同內部系統</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-8">
          填問卷（約 2 分鐘）→ 開會了解需求 → 我哋設計同部署 → 持續支援
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={AI_AGENT_QUESTIONNAIRE_URL}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 text-lg shadow-lg shadow-blue-900/40 transition-all hover:scale-[1.02]"
          >
            填問卷 · 了解 AI Agent 方案
          </Link>
          <WhatsAppContactButton className="px-10 py-4 text-lg" label="WhatsApp 預約會議" />
        </div>
      </div>
    </section>
  );
}
