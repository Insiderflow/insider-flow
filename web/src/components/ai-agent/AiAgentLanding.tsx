'use client';

import DeployButton from '@/components/ai-agent/DeployButton';
import WhatsAppContactButton from '@/components/ai-agent/WhatsAppContactButton';
import { AI_AGENT_BRAND, AI_AGENT_CONTACT_EMAIL } from '@/lib/aiAgentSite';

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

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
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

function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

const FAQ = [
  {
    q: '數據會唔會傳去 OpenAI / 雲端？',
    a: '唔會。整套 stack 跑喺你公司 server，LLM 推理、文件、對話記錄都留喺內網。我哋用開源 Ollama + Open WebUI，唔依賴 SaaS API。',
  },
  {
    q: '需唔需要好勁嘅 hardware？',
    a: 'CPU 入門版：4 vCPU + 16 GB RAM 已可試用（細模型）。20 人以上或要更快回覆，建議加 NVIDIA GPU（8 GB+ VRAM）。',
  },
  {
    q: 'PDPO / 私隱條例點算？',
    a: 'Private On-Prem 部署令個人資料唔離開公司控制範圍。內建 Audit log 記錄查詢同審批，方便 DPO 做合規查核。詳情可約我哋做 PDPO gap analysis。',
  },
  {
    q: 'IT 唔識 Docker 點算？',
    a: `install.sh 會自動 check Docker、拉 image、起 service。需要專人代部署可以 WhatsApp 我哋，或者 email ${AI_AGENT_CONTACT_EMAIL}。`,
  },
  {
    q: '可唔可以接現有 HR / ERP 系統？',
    a: '可以。n8n 工作流可接 webhook、Email、Google Drive、SharePoint 等。Chroma 做 RAG 知識庫。需要客製整合可聯絡我哋。',
  },
  {
    q: '同 ChatGPT Enterprise 有咩分別？',
    a: '你擁有完整 infra 同數據主權，一次部署長期用，無 per-seat 雲端費。適合對 data residency 同成本敏感嘅香港 SME。',
  },
];

export default function AiAgentLanding() {
  return (
    <div className="min-h-screen text-white">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f1a2e] to-[#0b1220]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-emerald-600/10 pointer-events-none" />
        <div className="relative z-10 px-5 sm:px-12 py-16 sm:py-24 text-center max-w-4xl mx-auto">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300 mb-6">
            <IconShield className="w-4 h-4" />
            香港 SME 專用 · Private On-Prem AI Agent
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-5">
            公司內部 AI 助手
            <span className="block text-emerald-400 mt-2">數據唔出門，老細都用得</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            唔使將機密文件 upload 去 ChatGPT。一條 command，喺自己 server 部署 Ollama + Open WebUI + 知識庫 Agent——PDPO 友好，5–10 分鐘搞掂。
          </p>
          <DeployButton className="px-8 py-4 text-base sm:text-lg" />
          <p className="mt-4 text-sm text-gray-500">
            開源 stack · 無 vendor lock-in · 支援 CPU 入門 / GPU 加速
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="mt-16 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">點解香港公司需要 Private AI？</h2>
        <p className="text-center text-gray-400 mb-10 max-w-2xl mx-auto">
          員工偷偷用 ChatGPT 處理客戶資料、合約、HR 文件——風險好真。
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: 'ChatGPT 怕 leak data',
              desc: '員工 copy 客戶資料、報價、內部策略去公有雲，一旦外泄難以追責，PDPO 下隨時中招。',
              icon: IconLock,
              color: 'text-red-400',
            },
            {
              title: '自己整 AI 太難',
              desc: 'LangChain、向量庫、GPU、security hardening——中小企 IT 一兩個人，根本無時間由零砌。',
              icon: IconServer,
              color: 'text-amber-400',
            },
            {
              title: 'PDPO 合規壓力',
              desc: '私隱專員同 audit 要證明：邊個查咗咩、數據去咗邊。公有 SaaS 好難完全掌控。',
              icon: IconShield,
              color: 'text-blue-400',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-white/10 bg-gray-900/80 p-6 hover:border-white/20 transition-colors"
            >
              <item.icon className={`w-10 h-10 mb-4 ${item.color}`} />
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section className="mt-20 px-2 sm:px-0">
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/50 to-gray-900 p-8 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">{AI_AGENT_BRAND} 提供咩？</h2>
          <p className="text-gray-300 mb-8 max-w-3xl leading-relaxed">
            一套經過整理嘅 open-source 私有化方案：Docker 一鍵起、靚仔 Web UI 俾全公司用、Human-in-the-loop 審批、完整 Audit log——專為非 tech 老闆同 compliance 而設。
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Private On-Prem — 全部跑喺公司 server / 私有 cloud',
              'Docker 一鍵 — 一條 bash command 自動 setup',
              'Open WebUI — 似 ChatGPT 嘅靚 UI，員工零培訓上手',
              'Human-in-the-loop — n8n 工作流，敏感答案要主管 approve',
              'Audit log — 每個 query 有記錄，方便 PDPO 查核',
              'Chroma RAG — 內部文件向量化，準確答公司政策問題',
            ].map((text) => (
              <li key={text} className="flex gap-3 text-sm text-gray-300">
                <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-20 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">點樣運作？三步搞掂</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Landing 下載',
              desc: '撳「一鍵部署」複製 install 指令，或下載完整 package.tar.gz 做離線部署。',
              icon: IconDownload,
            },
            {
              step: '2',
              title: 'Server 跑一條 command',
              desc: '喺公司 Linux / macOS（Docker 已裝）貼上指令，自動 pull images 同起 docker compose。',
              icon: IconServer,
            },
            {
              step: '3',
              title: '即刻用 Open WebUI',
              desc: '打開 http://公司IP:3000，建立 admin 帳號，upload 文件開始問答。',
              icon: IconChat,
            },
          ].map((item) => (
            <div key={item.step} className="relative text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center mb-4">
                <item.icon className="w-7 h-7 text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Step {item.step}</span>
              <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mt-20 px-2 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">五大優勢</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: IconLock, title: '數據永遠唔出門', desc: 'LLM 推理同文件 storage 全喺內網，無 API call 去 OpenAI。' },
            { icon: IconShield, title: 'PDPO 友好', desc: 'Audit trail、access control、可約 DPO review 部署架構。' },
            { icon: IconClock, title: '5–10 分鐘部署', desc: 'install.sh 自動 check Docker、拉 model、顯示 URL。' },
            { icon: IconUser, title: '非 tech 老闆都用得', desc: 'Open WebUI 介面直觀，唔使識 command line 日常用。' },
            { icon: IconCpu, title: 'CPU 入門 + GPU 可選', desc: '細團隊 CPU 夠試，人多再 upgrade GPU profile。' },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 rounded-xl border border-white/10 bg-gray-900/60 p-5">
              <item.icon className="w-8 h-8 text-blue-400 shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Template */}
      <section className="mt-20 px-2 sm:px-0">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="rounded-xl bg-emerald-600/20 p-4 shrink-0">
              <IconBook className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">第一個 Template</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">公司內部知識庫問答 Agent</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                將 HR handbook、SOP、IT 政策、FAQ PDF upload 去 Open WebUI，經 Chroma 做 RAG 向量化。員工用自然語言問「年假點計」「報銷流程」——Agent 只根據內部文件答，唔會亂估。
              </p>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>• 減少 HR / Admin 重複答同一條問題</li>
                <li>• 新同事 onboarding 自助查政策，24/7 有答</li>
                <li>• 敏感問題（薪酬、紀律）經 n8n 送主管 approve 先出答案</li>
                <li>• 所有 query 写入 Audit log，合規有得查</li>
              </ul>
              <DeployButton className="px-6 py-3 text-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-20 px-2 sm:px-0 mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">常見問題</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-white/10 bg-gray-900/60 open:border-emerald-500/30 transition-colors"
            >
              <summary className="cursor-pointer list-none px-5 py-4 font-medium flex justify-between items-center gap-4">
                {item.q}
                <span className="text-gray-500 group-open:rotate-180 transition-transform shrink-0">▼</span>
              </summary>
              <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-2xl border border-white/10 bg-gradient-to-r from-gray-900 via-blue-950/40 to-gray-900 p-10 text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">準備好將 AI 留喺公司內部？</h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          自己 deploy 完全免費（open source stack）。需要專人代部署、PDPO 顧問、或客製 Agent？我哋可以幫手。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <DeployButton className="px-8 py-4" />
          <WhatsAppContactButton className="px-8 py-4" />
        </div>
        <p className="mt-6 text-sm text-gray-500">
          WhatsApp 即時查詢 · 📧{' '}
          <a
            href={`mailto:${AI_AGENT_CONTACT_EMAIL}`}
            className="text-emerald-400/90 hover:text-emerald-300 transition-colors"
          >
            {AI_AGENT_CONTACT_EMAIL}
          </a>
          {' '}· 香港時間 Mon–Fri 回覆
        </p>
      </section>
    </div>
  );
}
