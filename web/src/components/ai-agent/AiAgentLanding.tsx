'use client';

import Link from 'next/link';
import DeploySection from '@/components/ai-agent/DeploySection';
import ProAgentSection from '@/components/ai-agent/ProAgentSection';
import {
  AI_AGENT_CONTACT_EMAIL,
  AI_AGENT_PRODUCT,
  AI_AGENT_QUESTIONNAIRE_URL,
  AI_AGENT_TAGLINE,
  getAiAgentDeployWhatsAppUrl,
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

const FAQ = [
  {
    q: '「私有 AI 助手」同「AI Agent」有咩分別？',
    a: '私有 AI 助手好似公司內部 ChatGPT：員工問答、查文件。AI Agent 就係 AI 幫你「做事」——例如整理請假、跟進客戶、自動發 email，關鍵步驟要你批。大部分公司由 Free Plan 開始就夠。',
  },
  {
    q: '同 ChatGPT 有咩分別？',
    a: 'ChatGPT 係上網用，你 paste 嘅資料會傳去外面。我哋嘅方案裝喺公司自己部機，對話同文件都留喺公司。',
  },
  {
    q: '我唔識電腦，用得唔用得？',
    a: '用得。最簡單係 WhatsApp 搵我哋專人幫手裝。如果想自己試，Mac/Linux 執行 install.sh；Windows 雙擊 install.bat，唔使打長指令。',
  },
  {
    q: 'Windows 可唔可以用？',
    a: '可以。先裝 Docker Desktop，下載安裝包，解壓後雙擊 install.bat 就得。',
  },
  {
    q: '裝完之後點維護？',
    a: '一般唔使理，裝好之後自己會運行。偶爾想更新可以 WhatsApp 搵我哋，或者揀 Professional Plan 包支援。',
  },
  {
    q: '要咩硬件？',
    a: '10 人以下：迷你主機 4 核、16GB 記憶體、512GB 硬碟，大約 $3,000–$6,000。詳見下面硬件建議表。',
  },
  {
    q: '公司資料會唔會俾人睇到？',
    a: '唔會傳去 OpenAI 或其他雲端。AI 喺你公司部機度運行，文件同對話都留喺內網。',
  },
  {
    q: 'AI Agent 方案係點運作？',
    a: '你填問卷、同我哋開會講需求，我哋用 LangGraph 幫你設計流程——AI 自己做大部分事，重要決定要你批。唔使你學任何 workflow 工具。',
  },
  {
    q: '第一次開啟要做咩？',
    a: '瀏覽器會開聊天介面，第一次要建立管理員帳號。之後 upload PDF 文件，就可以問 AI 公司政策。',
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
            香港 SME · Free Plan 完全免費
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-extrabold leading-tight tracking-tight mb-4">
            {AI_AGENT_PRODUCT}，{AI_AGENT_TAGLINE}
          </h1>
          <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
            似 ChatGPT 咁易用，但裝喺公司自己部機。
            員工可以問 HR 政策、SOP、FAQ —— 5–10 分鐘就用到，唔使請 IT。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <a
              href={getAiAgentDeployWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold px-10 py-5 text-lg shadow-lg shadow-[#25D366]/25 transition-all hover:scale-[1.02]"
            >
              WhatsApp 專人幫手部署
            </a>
            <a
              href="#deploy"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold px-10 py-5 text-lg transition-colors"
            >
              自己試 · 下載安裝包
            </a>
          </div>
          <p className="mt-5 text-sm text-gray-500">
            Mac / Linux / Windows 都支援 · 預設中文模型 qwen2.5:3b
          </p>
        </div>
      </section>

      {/* What is private AI assistant */}
      <section className="mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">咩係「私有 AI 助手」？</h2>
        <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
          用白話講：喺公司自己部機度，擺一個只俾你哋員工用嘅 ChatGPT。
        </p>
        <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
          {[
            { title: '似 ChatGPT 咁傾', desc: '員工用瀏覽器同 AI 對話，介面直觀' },
            { title: '識答公司問題', desc: 'Upload HR 手冊、SOP，AI 只根據你公司文件答' },
            { title: '數據唔出門', desc: '對話同文件都留喺公司，唔會傳去外面' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/10 bg-gray-900/70 p-5 text-center">
              <h3 className="text-emerald-400 font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Assistant vs Agent */}
      <section className="mt-16 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">私有 AI 助手 vs AI Agent</h2>
        <p className="text-center text-gray-400 mb-8 text-sm max-w-xl mx-auto">
          好多老闆問：我係要「傾偈查資料」，定係要 AI「幫我做事」？其實係兩個層次。
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-950/20 p-6">
            <p className="text-emerald-400 text-xs font-bold uppercase mb-2">Free Plan · 私有 AI 助手</p>
            <h3 className="text-lg font-bold mb-3">你問，AI 答</h3>
            <ul className="text-sm text-gray-300 space-y-2 mb-4">
              <li>• 查 HR 政策、SOP、FAQ</li>
              <li>• Upload 文件即刻用</li>
              <li>• 自己部署，$0 起</li>
              <li>• 唔使學任何工具</li>
            </ul>
            <p className="text-xs text-gray-500">適合：想快啲有公司內部 AI、又驚 data leak 嘅 SME</p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-6">
            <p className="text-blue-300 text-xs font-bold uppercase mb-2">Professional · AI Agent</p>
            <h3 className="text-lg font-bold mb-3">AI 幫你做事，你批關鍵步驟</h3>
            <ul className="text-sm text-gray-300 space-y-2 mb-4">
              <li>• 自動整理請假、跟進客戶</li>
              <li>• 接 Email、HR、SharePoint</li>
              <li>• 用 LangGraph 設計流程</li>
              <li>• 填問卷 + 開會，專人幫你搞</li>
            </ul>
            <p className="text-xs text-gray-500">適合：想自動化業務流程、又要有人工把關嘅公司</p>
          </div>
        </div>
      </section>

      {/* Deploy */}
      <section className="mt-20">
        <DeploySection />
      </section>

      {/* Free plan summary */}
      <section className="mt-20" id="plans">
        <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/20 p-8 max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-emerald-300 mb-2">Free Plan · 私有 AI 助手</h2>
          <p className="text-3xl font-extrabold mb-4">$0</p>
          <ul className="text-sm text-gray-300 space-y-2 mb-6 text-left max-w-xs mx-auto">
            <li>✓ 似 ChatGPT 嘅聊天介面</li>
            <li>✓ 公司知識庫問答</li>
            <li>✓ 數據 100% 留喺公司</li>
            <li>✓ Mac / Linux / Windows</li>
          </ul>
          <a
            href="#deploy"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-3 transition-colors"
          >
            開始部署
          </a>
        </div>
      </section>

      {/* Pro Agent — prominent standalone block */}
      <section className="mt-20">
        <ProAgentSection />
      </section>

      {/* Why HK SME */}
      <section className="mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">點解香港 SME 需要？</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: 'ChatGPT 怕 leak', desc: '員工將客戶資料 paste 去上網 ChatGPT，私隱風險好高。', icon: IconLock, color: 'text-red-400' },
            { title: '自己整太難', desc: '買 server、裝軟件、設定安全 —— 中小企冇 IT 團隊搞掂。', icon: IconServer, color: 'text-amber-400' },
            { title: '要簡單安心', desc: '老闆要知：數據唔出門、用得易、唔使成日搵 IT。', icon: IconShield, color: 'text-blue-400' },
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
            { step: '1', title: '下載 + 安裝', desc: '揀 Mac/Linux 或 Windows，跟住做。唔識可以 WhatsApp 搵人幫手。', icon: IconDownload },
            { step: '2', title: '等 5–10 分鐘', desc: '程式會自動裝好所需軟件、下載中文 AI 模型。', icon: IconServer },
            { step: '3', title: '開瀏覽器即用', desc: '建立管理員帳號，upload 公司文件，開始同 AI 傾偈。', icon: IconChat },
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
      <section className="mt-20" id="hardware">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">要買咩機？（硬件建議）</h2>
        <p className="text-center text-gray-400 mb-8 text-sm">一部迷你主機放喺辦公室就得，接公司內網。唔使買雲端 server。</p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-900/80 text-gray-300">
              <tr>
                <th className="px-5 py-3 font-semibold">公司規模</th>
                <th className="px-5 py-3 font-semibold">建議配置</th>
                <th className="px-5 py-3 font-semibold">例子</th>
                <th className="px-5 py-3 font-semibold">預算（HKD）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-gray-400">
              <tr className="bg-gray-900/40">
                <td className="px-5 py-4 text-white font-medium">試用 / ≤10 人</td>
                <td className="px-5 py-4">4 核 · 16 GB 記憶體 · 512 GB 硬碟</td>
                <td className="px-5 py-4">Intel NUC、迷你 PC</td>
                <td className="px-5 py-4">$3,000 – $6,000</td>
              </tr>
              <tr>
                <td className="px-5 py-4 text-white font-medium">10–30 人</td>
                <td className="px-5 py-4">8 核 · 32 GB · 1 TB 硬碟</td>
                <td className="px-5 py-4">小型 server</td>
                <td className="px-5 py-4">$8,000 – $15,000</td>
              </tr>
              <tr className="bg-gray-900/40">
                <td className="px-5 py-4 text-white font-medium">30 人+</td>
                <td className="px-5 py-4">加 GPU 會快啲</td>
                <td className="px-5 py-4">GPU server（Professional 可代選購）</td>
                <td className="px-5 py-4">按需報價</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">
          唔肯定買咩？WhatsApp 我哋，可以幫你睇吓現有電腦用得唔用得。
        </p>
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
                Upload HR 手冊、SOP、報銷政策 → 員工問「年假點計」「點報銷」→ AI 只根據內部文件答。
              </p>
              <ul className="text-sm text-gray-400 space-y-1 mb-6">
                <li>• 減少 HR 重複答同一條問題</li>
                <li>• 新同事 24/7 自助查政策</li>
                <li>• Upload PDF 就用</li>
              </ul>
              <a
                href="#deploy"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 transition-colors"
              >
                開始部署
              </a>
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
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">準備好試吓未？</h2>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto text-sm">
          Free Plan 完全免費、數據留喺公司。需要 AI Agent？睇下面專業方案。
        </p>
        <a
          href={getAiAgentDeployWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold px-10 py-5 text-lg shadow-lg shadow-[#25D366]/25 mb-4 transition-all hover:scale-[1.02]"
        >
          WhatsApp 專人幫手部署
        </a>
        <p className="mb-6">
          <a href="#deploy" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
            或者自己下載安裝包 →
          </a>
        </p>
        <div className="pt-4 border-t border-white/10">
          <Link
            href={AI_AGENT_QUESTIONNAIRE_URL}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 text-sm transition-colors"
          >
            我想了解 AI Agent 方案 →
          </Link>
        </div>
        <p className="mt-6 text-xs text-gray-500">
          📧 {AI_AGENT_CONTACT_EMAIL}
        </p>
      </section>
    </div>
  );
}
