'use client';

import Link from 'next/link';
import {
  AI_AGENT_INSTALL_BAT_PATH,
  AI_AGENT_INSTALL_SH_PATH,
  AI_AGENT_PACKAGE_PATH,
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

type DeploySectionProps = {
  compact?: boolean;
};

export default function DeploySection({ compact = false }: DeploySectionProps) {
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
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">自己部署（Free Plan）</h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          揀你部電腦嘅系統，下載安裝包跟住做。全程唔使打長指令。
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
        {/* Mac / Linux */}
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-gray-900/70 p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-800 text-white shrink-0">
              <IconApple className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Mac / Linux</h3>
              <p className="text-xs text-gray-500 mt-0.5">包括 WSL</p>
            </div>
          </div>
          <ol className="text-sm text-gray-400 space-y-3 mb-8 flex-1">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-bold">1</span>
              <span>下載安裝包，解壓到資料夾</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-bold">2</span>
              <span>執行 <strong className="text-gray-300">install.sh</strong>（雙擊或右鍵執行）</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 text-xs font-bold">3</span>
              <span>等 5–10 分鐘，瀏覽器會自動開啟</span>
            </li>
          </ol>
          <a
            href={AI_AGENT_PACKAGE_PATH}
            download
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 text-base transition-colors"
          >
            下載 Mac / Linux 安裝包
          </a>
          <a
            href={AI_AGENT_INSTALL_SH_PATH}
            download
            className="mt-2 text-center text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            已有 package？只下載 install.sh
          </a>
        </div>

        {/* Windows */}
        <div className="rounded-2xl border-2 border-blue-500/30 bg-gray-900/70 p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-900/50 text-blue-300 shrink-0">
              <IconWindows className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Windows</h3>
              <p className="text-xs text-gray-500 mt-0.5">需 Docker Desktop</p>
            </div>
          </div>
          <ol className="text-sm text-gray-400 space-y-3 mb-8 flex-1">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold">1</span>
              <span>
                安裝{' '}
                <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  Docker Desktop
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold">2</span>
              <span>下載安裝包，解壓到資料夾</span>
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
          <a
            href={AI_AGENT_INSTALL_BAT_PATH}
            download
            className="mt-2 text-center text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            已有 package？只下載 install.bat
          </a>
        </div>
      </div>

      <p className="text-center text-xs text-gray-500 mt-8 leading-relaxed max-w-lg mx-auto">
        首次開啟要建立管理員帳號。預設中文模型 qwen2.5:3b，腳本會自動下載。
        <br />
        唔識裝？Hero 區有 WhatsApp 專人幫手部署。
      </p>
    </section>
  );
}
