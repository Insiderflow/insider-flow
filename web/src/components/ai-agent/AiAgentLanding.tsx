'use client';

import Link from 'next/link';
import DeployButton from '@/components/ai-agent/DeployButton';
import WhatsAppContactButton from '@/components/ai-agent/WhatsAppContactButton';
import {
  AI_AGENT_BRAND,
  AI_AGENT_CONTACT_EMAIL,
  AI_AGENT_PRODUCT,
  AI_AGENT_QUESTIONNAIRE_URL,
} from '@/lib/aiAgentSite';

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function IconServer({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008H12v-.008Z" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function IconCpu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
    </svg>
  );
}

const FAQ = [
  {
    q: '「私有 AI 助手」同 ChatGPT 有咩分別？',
    a: 'ChatGPT 係公有雲，你 upload 嘅文件會離開公司。私有 AI 助手跑喺你自己部機 / server，對話同文件都留喺內網，PDPO 風險低好多。',
  },
  {
    q: 'Windows 支唔支援？',
    a: '支援。Windows 用戶安裝 Docker Desktop（WSL2），解壓 package 後雙擊 install.bat 就得。Linux / macOS 用 install.sh 一條 command。',
  },
  {
    q: '難唔難用？要唔要請 IT？',
    a: 'Free Plan 設計俾非 tech 老闆：一鍵部署，Open WebUI 介面似 ChatGPT，upload PDF 就可以做知識庫問答。日常用唔使 command line。',
  },
  {
    q: '數據會唔會傳去 OpenAI / 雲端？',
    a: '唔會。Free Plan 用 Ollama 本地推理，全部喺你公司 hardware 跑，無 API call 去外部。',
  },
  {
    q: '之後點維護？',
    a: '一般唔使理，Docker 會自動 restart。偶爾 update：docker compose pull && docker compose up -d。需要專人維護可選 Professional Plan。',
  },
  {
    q: '要咩 hardware？',
    a: '10 人以下：迷你主機 4核/16GB/512GB SSD 已夠試用。20 人以上建議加 GPU。詳見下面硬件建議。',
  },
  {
    q: 'Free Plan 包唔包 AI Agent / 工作流？',
    a: 'Free Plan 係私有 AI 助手（Chat + RAG）。Human-in-the-loop、workflow、系統整合屬於 Professional Plan（AI Agent），填問卷 + 開會由我哋設計。',
  },
  {
    q: 'PDPO 合規點算？',
    a: 'Private On-Prem 令個人資料唔離開公司。Professional Plan 可加 audit、access control 同 DPO review。',
  },
  {
    q: 'IT 唔識 Docker 點算？',
    a: '腳本全自動。仍然唔得可以 WhatsApp 代部署，或揀 Professional Plan。',
  },
];

export default function AiAgentLanding() {
  return (
    <div className="min-h-screen text-white">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-[#0f1a2e] to-[#0b1220]">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-blue-600/10 pointer-events-none" />
        <div className="relative z-10 px-5 sm:px-12 py-16 sm:py-20 text-center max-w-4xl mx-auto">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-300 mb-6">
            <IconShield className="w-4 h-4" />
            香港 SME · Free Plan 完全免費自助部署
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-[3.25rem] font-extrabold leading-tight tracking-tight mb-4">
            {AI_AGENT_PRODUCT}
          </h1>
          <p className="text-xl sm:text-2xl text-emerald-400 font-semibold mb-6">
            似 ChatGPT，但數據永遠留喺公司
          </p>
          <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
            一鍵部署 Ollama + Open WebUI + 知識庫 RAG。唔使學 n8n、唔使請 IT，
            5–10 分鐘就有公司專用 AI 問答 —— PDPO 友好，老闆自己搞得掂。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <DeployButton className="px-10 py-5 text-lg shadow-xl shadow-emerald-900/40 ring-2 ring-emerald-400/30" />
          </div>
          <p className="mt-5 text-sm text-gray-500">
            Linux / macOS / WSL：一條 command · Windows：install.bat · 模型 qwen2.5:3b
          </p>
        </div>
      </section>

      {/* What is */}
      <section className="mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">咩係「私有 AI 助手」？</h2>
        <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto text-sm sm:text-base">
          用簡單嘅話：喺公司自己部機度，擺一個只俾你哋員工用嘅 ChatGPT。
        </p>
        <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
          {[
            { title: 'Chat', desc: '員工用瀏覽器同 AI 傾偈，介面直觀' },
            { title: 'RAG 知識庫', desc: 'Upload HR / SOP PDF，AI 只根據你公司文件答' },
            { title: 'Private', desc: '所有對話同文件留喺公司 server，唔上公有雲' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/10 bg-gray-900/70 p-5 text-center">
              <h3 className="text-emerald-400 font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="mt-20" id="plans">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Free Plan vs Professional Plan</h2>
        <div className="grid gap-6 lg:grid-cols-2 max-w-5xl mx-auto">
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/20 p-8 relative">
            <span className="absolute -top-3 left-6 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              推薦起步
            </span>
            <h3 className="text-xl font-bold text-emerald-300 mb-1">Free · 私有 AI 助手</h3>
            <p className="text-3xl font-extrabold mb-4">$0 <span className="text-base font-normal text-gray-400">自助部署</span></p>
            <ul className="space-y-3 text-sm text-gray-300 mb-8">
              <li>✓ Ollama + Open WebUI + Chroma RAG</li>
              <li>✓ 一鍵 install.sh / install.bat</li>
              <li>✓ 公司知識庫問答（HR / SOP / FAQ）</li>
              <li>✓ 數據 100% 留喺公司</li>
              <li>✓ 唔使學 workflow 工具</li>
            </ul>
            <DeployButton className="w-full py-4" />
          </div>
          <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-8">
            <h3 className="text-xl font-bold text-blue-300 mb-1">Professional · AI Agent</h3>
            <p className="text-3xl font-extrabold mb-4">按需報價 <span className="text-base font-normal text-gray-400">專人服務</span></p>
            <ul className="space-y-3 text-sm text-gray-300 mb-8">
              <li>✓ Human-in-the-loop 審批流程</li>
              <li>✓ 客製 workflow（n8n 等）</li>
              <li>✓ 接 HR / ERP / Email / SharePoint</li>
              <li>✓ PDPO 合規顧問 + 代部署</li>
              <li>✓ 專人設計，唔使你砌</li>
            </ul>
            <div className="flex flex-col gap-3">
              <Link
                href={AI_AGENT_QUESTIONNAIRE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 transition-colors"
              >
                填需求問卷
              </Link>
              <WhatsAppContactButton className="w-full py-4" label="WhatsApp 預約會議" />
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">點解香港 SME 需要？</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: 'ChatGPT 怕 leak', desc: '員工將客戶資料 paste 去公有雲，PDPO 風險好高。', icon: IconLock, color: 'text-red-400' },
            { title: '自己整太難', desc: '向量庫、GPU、security——中小企 IT 無時間由零砌。', icon: IconServer, color: 'text-amber-400' },
            { title: '要簡單合規', desc: '老闆要安心：數據唔出門、用得易、唔使成日搵 IT。', icon: IconShield, color: 'text-blue-400' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/10 bg-gray-900/80 p-6">
              <item.icon className={`w-10 h-10 mb-4 ${item.color}`} />
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Free Plan 三步搞掂</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { step: '1', title: '撳一鍵部署', desc: '複製 install 指令，或 Windows 雙擊 install.bat。', icon: IconDownload },
            { step: '2', title: '等 5–10 分鐘', desc: '腳本自動裝 Docker、起 service、download 中文模型。', icon: IconServer },
            { step: '3', title: '開 browser 即用', desc: '建立 admin 帳號，upload 文件，開始同 AI 傾偈。', icon: IconChat },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center mb-4">
                <item.icon className="w-7 h-7 text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-emerald-500 uppercase">Step {item.step}</span>
              <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hardware */}
      <section className="mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">硬件建議（迷你主機）</h2>
        <p className="text-center text-gray-400 mb-8 text-sm">放喺辦公室 server room / IT 房，接公司內網就得</p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-900/80 text-gray-300">
              <tr>
                <th className="px-5 py-3 font-semibold">規模</th>
                <th className="px-5 py-3 font-semibold">CPU / RAM / 硬碟</th>
                <th className="px-5 py-3 font-semibold">參考配置</th>
                <th className="px-5 py-3 font-semibold">預算（HKD）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-gray-400">
              <tr className="bg-gray-900/40">
                <td className="px-5 py-4 text-white font-medium">試用 / ≤10 人</td>
                <td className="px-5 py-4">4 核 · 16 GB · 512 GB SSD</td>
                <td className="px-5 py-4">Intel NUC / 迷你 PC / 舊 workstation</td>
                <td className="px-5 py-4">$3,000 – $6,000</td>
              </tr>
              <tr>
                <td className="px-5 py-4 text-white font-medium">10–30 人</td>
                <td className="px-5 py-4">8 核 · 32 GB · 1 TB SSD</td>
                <td className="px-5 py-4">小型 server 或 GPU 入門機</td>
                <td className="px-5 py-4">$8,000 – $15,000</td>
              </tr>
              <tr className="bg-gray-900/40">
                <td className="px-5 py-4 text-white font-medium">30 人+</td>
                <td className="px-5 py-4">+ NVIDIA GPU 8 GB+ VRAM</td>
                <td className="px-5 py-4">GPU server（Professional 可代選購）</td>
                <td className="px-5 py-4">按需報價</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Use case */}
      <section className="mt-20">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="rounded-xl bg-emerald-600/20 p-4 shrink-0 self-start">
              <IconBook className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase mb-2">Free Plan 即刻用到</p>
              <h2 className="text-2xl font-bold mb-4">公司知識庫問答</h2>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Upload HR handbook、SOP、報銷政策 PDF → 員工問「年假點計」「點報銷」→ AI 只根據內部文件答，唔會乱估。
              </p>
              <ul className="text-sm text-gray-400 space-y-1 mb-6">
                <li>• 減少 HR 重複答同一條問題</li>
                <li>• 新同事 24/7 自助查政策</li>
                <li>• 唔使學 workflow，upload 就用</li>
              </ul>
              <DeployButton className="px-6 py-3" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-20 mb-12" id="faq">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">常見問題</h2>
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-xl border border-white/10 bg-gray-900/60 open:border-emerald-500/30">
              <summary className="cursor-pointer list-none px-5 py-4 font-medium flex justify-between gap-4">
                {item.q}
                <span className="text-gray-500 group-open:rotate-180 transition-transform shrink-0">▼</span>
              </summary>
              <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-[#0b1220] to-blue-950/30 p-10 text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">而家開始：Free Plan 一鍵部署</h2>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto text-sm">
          完全免費、開源、數據唔出公司。有進階 AI Agent 需求？填問卷 + 預約會議。
        </p>
        <DeployButton className="px-10 py-5 text-lg mb-6" />
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4 border-t border-white/10">
          <Link
            href={AI_AGENT_QUESTIONNAIRE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            Professional Plan：填需求問卷 →
          </Link>
          <span className="text-gray-600 hidden sm:inline">|</span>
          <WhatsAppContactButton className="px-6 py-2.5 text-sm" label="WhatsApp 預約會議" />
        </div>
        <p className="mt-6 text-xs text-gray-500">
          📧 {AI_AGENT_CONTACT_EMAIL} · {AI_AGENT_BRAND}
        </p>
      </section>
    </div>
  );
}
