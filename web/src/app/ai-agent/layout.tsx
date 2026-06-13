import { AI_AGENT_BRAND, AI_AGENT_CONTACT_EMAIL } from '@/lib/aiAgentSite';
import AiAgentHeader from '@/components/ai-agent/AiAgentHeader';

export default function AiAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AiAgentHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {children}
      </main>
      <footer className="border-t border-white/10 bg-[#070d18]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-500">
          <div>
            <p className="font-semibold text-gray-300">{AI_AGENT_BRAND}</p>
            <p className="mt-1">香港中小企 · 公司內部私有 AI 助手</p>
          </div>
          <div className="flex flex-col sm:items-end gap-1">
            <a
              href={`mailto:${AI_AGENT_CONTACT_EMAIL}`}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {AI_AGENT_CONTACT_EMAIL}
            </a>
            <p>© {new Date().getFullYear()} {AI_AGENT_BRAND}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
