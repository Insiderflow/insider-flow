'use client';

import Link from 'next/link';
import {
  AI_AGENT_INSTALL_BAT_PATH,
  AI_AGENT_INSTALL_SH_PATH,
  AI_AGENT_PACKAGE_PATH,
  getAiAgentDeployWhatsAppUrl,
} from '@/lib/aiAgentSite';

function IconApple({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function IconWindows({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 5.5 10.5 4.5V11.5H3V5.5M10.5 12.5V19.5L3 18.4V12.5H10.5M11.5 4 21 2.5V11.5H11.5V4M21 12.5V21.5L11.5 19.5V12.5H21Z" />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

type DeploySectionProps = {
  compact?: boolean;
};

export default function DeploySection({ compact = false }: DeploySectionProps) {
  const waDeploy = getAiAgentDeployWhatsAppUrl();

  if (compact) {
    return (
      <Link
        href="#deploy"
        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 text-sm transition-colors"
      >
        開始部署
      </Link>
    );
  }

  return (
    <section id="deploy" className="scroll-mt-24">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">點樣開始用？</h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          唔識裝都唔使驚。我哋建議大部分老闆先試「專人幫手部署」—— 最快、最省心。
        </p>
      </div>

      {/* 專人幫手 — 最突出 */}
      <div className="rounded-2xl border-2 border-[#25D366]/60 bg-[#25D366]/10 p-6 sm:p-8 mb-8 max-w-4xl mx-auto relative shadow-lg shadow-[#25D366]/10">
        <span className="absolute -top-3 left-6 bg-[#25D366] text-white text-xs font-bold px-3 py-1 rounded-full">
          最多老闆揀呢個 · 最省心
        </span>
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">專人幫手部署（推薦）</h3>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              WhatsApp 我哋，約時間遠程或上門幫你裝好。
              適合律師樓、會計樓、地產公司——唔想自己碰安裝、想快啲用到嘅老闆。
            </p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>✓ Free Plan · 軟件本身 $0</li>
              <li>✓ 代部署服務按需報價</li>
              <li>✓ 唔使學任何技術詞</li>
            </ul>
          </div>
          <a
            href={waDeploy}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold px-10 py-5 text-lg shadow-lg shadow-[#25D366]/30 transition-all hover:scale-[1.02] shrink-0"
          >
            <IconWhatsApp className="w-6 h-6" />
            WhatsApp 搵人幫手裝
          </a>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mb-6">或者自己試（完全免費）</p>

      <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-gray-900/70 p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-800 text-white shrink-0">
              <IconApple className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Mac / Linux</h3>
              <p className="text-xs text-gray-500 mt-0.5">Apple 電腦或 Linux</p>
            </div>
          </div>
          <ol className="text-sm text-gray-400 space-y-3 mb-8 flex-1">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-bold">1</span>
              <span>下載安裝包，解壓</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-bold">2</span>
              <span>撳一下 <strong className="text-gray-300">install.sh</strong> 跟住做</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-bold">3</span>
              <span>等幾分鐘，瀏覽器會自動開</span>
            </li>
          </ol>
          <a
            href={AI_AGENT_PACKAGE_PATH}
            download
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 text-base transition-colors"
          >
            下載 Mac / Linux 安裝包
          </a>
          <a href={AI_AGENT_INSTALL_SH_PATH} download className="mt-2 text-center text-xs text-gray-500 hover:text-gray-400">
            已有安裝包？只下載 install.sh
          </a>
        </div>

        <div className="rounded-2xl border-2 border-blue-500/30 bg-gray-900/70 p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-900/50 text-blue-300 shrink-0">
              <IconWindows className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Windows</h3>
              <p className="text-xs text-gray-500 mt-0.5">Windows 10 / 11</p>
            </div>
          </div>
          <ol className="text-sm text-gray-400 space-y-3 mb-8 flex-1">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold">1</span>
              <span>
                先裝{' '}
                <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  Docker Desktop
                </a>
                （免費程式，跟住做就得）
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold">2</span>
              <span>下載安裝包，解壓</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold">3</span>
              <span>雙擊 <strong className="text-gray-300">install.bat</strong></span>
            </li>
          </ol>
          <a
            href={AI_AGENT_PACKAGE_PATH}
            download
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 text-base transition-colors"
          >
            下載 Windows 安裝包
          </a>
          <a href={AI_AGENT_INSTALL_BAT_PATH} download className="mt-2 text-center text-xs text-gray-500 hover:text-gray-400">
            已有安裝包？只下載 install.bat
          </a>
        </div>
      </div>

      <p className="text-center text-xs text-gray-500 mt-8 leading-relaxed max-w-md mx-auto">
        第一次開啟要建立管理員帳號。全程唔使打長長嘅指令。
      </p>
    </section>
  );
}
