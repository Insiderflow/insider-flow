'use client';

import Link from 'next/link';
import DeploySection from '@/components/ai-agent/DeploySection';
import ProAgentSection from '@/components/ai-agent/ProAgentSection';
import WhatsAppContactButton from '@/components/ai-agent/WhatsAppContactButton';
import {
  AI_AGENT_CONTACT_EMAIL,
  AI_AGENT_QUESTIONNAIRE_URL,
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
    q: '同 ChatGPT 有咩分別？',
    a: 'ChatGPT 係上網用，你 paste 嘅客戶資料、合約內容會傳去外面。私有 AI 助手裝喺公司自己部機，對話同文件都留喺公司，對律師樓、會計樓特別重要。',
  },
  {
    q: '我唔識電腦，用得唔用得？',
    a: '用得。最簡單係 WhatsApp 搵我哋專人幫手裝。如果想自己試，Mac 撳 install.sh、Windows 雙擊 install.bat，全程唔使打長指令。',
  },
  {
    q: 'Free Plan 同 Paid Plan 有咩分別？',
    a: 'Free Plan：似 ChatGPT 咁傾偈、查公司文件，自己裝或搵人幫手，$0 起。Paid Plan：AI 幫你處理業務流程（跟進客戶、審批等），填問卷 + 開會，專人幫你設計。',
  },
  {
    q: 'Windows 可唔可以用？',
    a: '可以。先裝 Docker Desktop（免費），下載安裝包，雙擊 install.bat 就得。',
  },
  {
    q: '要買咩電腦？',
    a: '10 人以下：一部迷你主機（約 $3,000–$6,000）放喺辦公室就得。詳見下面硬件建議。',
  },
  {
    q: '裝完之後要唔要請 IT 維護？',
    a: '一般唔使理，裝好之後自己會運行。有問題 WhatsApp 搵我哋就得。',
  },
  {
    q: '第一次開啟要做咩？',
    a: '瀏覽器會開一個聊天畫面，第一次要建立管理員帳號。之後上載公司 PDF，就可以問 AI。',
  },
];

export default function AiAgentLanding() {
  return (
    <div className="min-h-screen text-white">
      {/* 1. Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-[#0f1a2e] to-[#0b1220]">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-blue-600/10 pointer-events-none" />
        <div className="relative z-10 px-5 sm:px-12 py-16 sm:py-20 text-center max-w-4xl mx-auto">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-300 mb-6">
            <IconShield className="w-4 h-4" />
            律師樓 · 會計 · 地產 · 香港 SME
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-[2.85rem] font-extrabold leading-tight tracking-tight mb-4">
            似 ChatGPT，但只屬於你公司
            <span className="block text-emerald-400 mt-2 text-2xl sm:text-3xl md:text-[2rem]">數據永遠唔出公司</span>
          </h1>
          <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto mb-10 leading-relaxed">
            公司內部私有 AI 助手 —— 員工可以問 HR 政策、內部指引、SOP，
            即刻用得到，又唔使驚客戶資料外洩。完全免費試用。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <a
              href={getAiAgentDeployWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold px-10 py-5 text-lg shadow-lg shadow-[#25D366]/25 transition-all hover:scale-[1.02]"
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
          <p className="mt-5 text-sm text-gray-500">Mac / Windows 都支援 · 唔使請 IT</p>
        </div>
      </section>

      {/* 2. 問題 */}
      <section className="mt-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">你有冇遇過呢啲情況？</h2>
        <p className="text-center text-gray-400 mb-8 text-sm max-w-lg mx-auto">
          好多香港老闆都有同感 —— 想用 AI，但又驚資料安全。
        </p>
        <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
          {[
            {
              title: '驚員工用 ChatGPT leak 資料',
              desc: '客戶名、合約、報價 paste 去上網 ChatGPT，私隱風險好高。',
              icon: IconLock,
              color: 'text-red-400',
            },
            {
              title: '自己整太複雜',
              desc: '聽到 AI、雲端、部署就頭痛，中小企冇 IT 團隊搞掂。',
              icon: IconShield,
              color: 'text-amber-400',
            },
            {
              title: '想簡單又安心',
              desc: '要似 ChatGPT 咁易用，但數據留喺公司，唔使成日搵 IT。',
              icon: IconChat,
              color: 'text-emerald-400',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/10 bg-gray-900/80 p-6">
              <item.icon className={`w-10 h-10 mb-4 ${item.color}`} />
              <h3 className="text-base font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 解決方案 + 教育 */}
      <section className="mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">我哋嘅方案：公司內部私有 AI 助手</h2>
        <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto text-sm leading-relaxed">
          用白話講：喺公司自己部機（或者辦公室一部細電腦）度，擺一個只俾你哋員工用嘅 ChatGPT。
        </p>

        <div className="max-w-3xl mx-auto rounded-2xl border border-white/10 overflow-hidden mb-8">
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            <div className="p-6 bg-red-950/20">
              <p className="text-red-300 text-xs font-bold mb-2">上網 ChatGPT</p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>✗ 資料傳去外面</li>
                <li>✗ 客戶資料有外洩風險</li>
                <li>✗ 唔識你公司內部文件</li>
              </ul>
            </div>
            <div className="p-6 bg-emerald-950/20">
              <p className="text-emerald-300 text-xs font-bold mb-2">私有 AI 助手（我哋）</p>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>✓ 數據留喺公司</li>
                <li>✓ 上載公司文件，只根據內部資料答</li>
                <li>✓ 似 ChatGPT 咁易用</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
          {[
            { title: '即刻用得到', desc: '員工開瀏覽器就傾，唔使培訓' },
            { title: '識答公司問題', desc: '上載 HR 手冊、SOP、內部指引' },
            { title: '數據唔出門', desc: '對話同文件都留喺公司' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-emerald-500/20 bg-gray-900/60 p-5 text-center">
              <h3 className="text-emerald-400 font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 兩個選擇 */}
      <section className="mt-20" id="plans">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">揀邊個適合你？</h2>
        <p className="text-center text-gray-400 mb-10 text-sm">大部分公司由 Free Plan 開始就夠</p>
        <div className="grid gap-6 lg:grid-cols-2 max-w-5xl mx-auto">
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/25 p-8 relative">
            <span className="absolute -top-3 left-6 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              推薦起步
            </span>
            <p className="text-emerald-400 text-xs font-bold uppercase mb-1">Free Plan</p>
            <h3 className="text-xl font-bold mb-2">私有 AI 助手 · 自己裝</h3>
            <p className="text-3xl font-extrabold mb-4">$0</p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-8">
              <li>✓ 似 ChatGPT 咁傾偈</li>
              <li>✓ 上載公司文件做問答</li>
              <li>✓ 數據 100% 留喺公司</li>
              <li>✓ 專人幫手裝 或 自己下載安裝包</li>
              <li>✓ 唔使學任何技術工具</li>
            </ul>
            <div className="flex flex-col gap-3">
              <a
                href={getAiAgentDeployWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-3.5 transition-colors"
              >
                WhatsApp 專人幫手部署
              </a>
              <a
                href="#deploy"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40 py-3.5 transition-colors"
              >
                自己試 · 下載安裝包
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/40 bg-blue-950/20 p-8">
            <p className="text-blue-300 text-xs font-bold uppercase mb-1">Paid Plan</p>
            <h3 className="text-xl font-bold mb-2">AI Agent · 專業部署</h3>
            <p className="text-3xl font-extrabold mb-4">按需報價</p>
            <ul className="space-y-2.5 text-sm text-gray-300 mb-8">
              <li>✓ AI 幫你處理業務（唔止傾偈）</li>
              <li>✓ 重要步驟要你親自批</li>
              <li>✓ 接電郵、內部系統</li>
              <li>✓ 填問卷 + 開會，專人幫你設計</li>
            </ul>
            <div className="flex flex-col gap-3">
              <Link
                href={AI_AGENT_QUESTIONNAIRE_URL}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 transition-colors"
              >
                填問卷 · 了解 AI Agent 方案
              </Link>
              <WhatsAppContactButton className="w-full py-3.5" label="WhatsApp 預約會議" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. 部署 */}
      <section className="mt-20">
        <DeploySection />
      </section>

      {/* 6. 行業例子 */}
      <section className="mt-20">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="rounded-xl bg-emerald-600/20 p-4 shrink-0 self-start">
              <IconBook className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-semibold mb-2">Free Plan 即刻用到</p>
              <h2 className="text-2xl font-bold mb-4">行業例子：律師樓 / 會計 / 地產</h2>
              <ul className="text-sm text-gray-300 space-y-3 mb-6">
                <li>
                  <strong className="text-white">律師樓：</strong>
                  上載內部指引、合約模板 → 同事問「呢個條款點解釋」→ AI 只根據公司文件答
                </li>
                <li>
                  <strong className="text-white">會計樓：</strong>
                  上載報稅 SOP、內部政策 → 減少同事重複答同一條問題
                </li>
                <li>
                  <strong className="text-white">地產：</strong>
                  上載物業資料、銷售話術 → 前線 24/7 自助查，唔使成日 WhatsApp 問主管
                </li>
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

      {/* 7. 三步搞掂 */}
      <section className="mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Free Plan 三步搞掂</h2>
        <div className="grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
          {[
            { step: '1', title: '揀方式', desc: 'WhatsApp 搵人幫手裝，或者自己下載安裝包。', icon: IconDownload },
            { step: '2', title: '等幾分鐘', desc: '程式會自動搞掂，唔使你自己設定。', icon: IconShield },
            { step: '3', title: '開瀏覽器即用', desc: '建立帳號，上載公司文件，開始問 AI。', icon: IconChat },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center mb-4">
                <item.icon className="w-7 h-7 text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-emerald-500">第 {item.step} 步</span>
              <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Paid 區塊 */}
      <section className="mt-20">
        <ProAgentSection />
      </section>

      {/* 9. 硬件 */}
      <section className="mt-20" id="hardware">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">要買咩電腦？</h2>
        <p className="text-center text-gray-400 mb-8 text-sm">
          一部迷你主機放喺辦公室就得，唔使買雲端。唔肯定？WhatsApp 我哋幫你睇。
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10 max-w-4xl mx-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-900/80 text-gray-300">
              <tr>
                <th className="px-5 py-3 font-semibold">公司規模</th>
                <th className="px-5 py-3 font-semibold">建議配置</th>
                <th className="px-5 py-3 font-semibold">預算（HKD）</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-gray-400">
              <tr className="bg-gray-900/40">
                <td className="px-5 py-4 text-white font-medium">≤10 人</td>
                <td className="px-5 py-4">4 核 · 16 GB 記憶體 · 512 GB 硬碟</td>
                <td className="px-5 py-4">$3,000 – $6,000</td>
              </tr>
              <tr>
                <td className="px-5 py-4 text-white font-medium">10–30 人</td>
                <td className="px-5 py-4">8 核 · 32 GB · 1 TB 硬碟</td>
                <td className="px-5 py-4">$8,000 – $15,000</td>
              </tr>
              <tr className="bg-gray-900/40">
                <td className="px-5 py-4 text-white font-medium">30 人+</td>
                <td className="px-5 py-4">加強版配置（Paid Plan 可代選購）</td>
                <td className="px-5 py-4">按需報價</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 10. FAQ */}
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

      {/* 11. Final CTA */}
      <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-[#0b1220] to-blue-950/30 p-10 text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">準備好試吓未？</h2>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto text-sm">
          完全免費、數據留喺公司。唔識裝就 WhatsApp 搵人幫手 —— 最快搞掂。
        </p>
        <a
          href={getAiAgentDeployWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold px-10 py-5 text-lg shadow-lg shadow-[#25D366]/25 mb-4 transition-all hover:scale-[1.02]"
        >
          WhatsApp 專人幫手部署
        </a>
        <p className="mb-6">
          <a href="#deploy" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
            或者自己下載安裝包 →
          </a>
        </p>
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={AI_AGENT_QUESTIONNAIRE_URL}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 text-sm transition-colors"
          >
            需要 AI Agent？填問卷 →
          </Link>
          <WhatsAppContactButton className="px-8 py-3 text-sm" label="WhatsApp 預約會議" />
        </div>
        <p className="mt-6 text-xs text-gray-500">📧 {AI_AGENT_CONTACT_EMAIL}</p>
      </section>
    </div>
  );
}
