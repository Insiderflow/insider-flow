'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AI_AGENT_INSTALL_CMD,
  AI_AGENT_PACKAGE_PATH,
} from '@/lib/aiAgentSite';

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function DeployModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(AI_AGENT_INSTALL_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deploy-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <h2 id="deploy-modal-title" className="text-xl font-bold text-white">
            一鍵部署到公司內部
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            喺公司 Linux / macOS server 貼上以下指令，5–10 分鐘內即可用。
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              安裝指令
            </label>
            <div className="mt-2 flex gap-2">
              <code className="flex-1 rounded-lg bg-black/50 border border-white/10 px-3 py-3 text-sm text-emerald-300 font-mono break-all">
                {AI_AGENT_INSTALL_CMD}
              </code>
              <button
                type="button"
                onClick={copy}
                className="shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                {copied ? '已複製 ✓' : '複製'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            GPU 模式：<code className="text-gray-400">... | bash -s -- --profile gpu</code>
          </p>
          <a
            href={AI_AGENT_PACKAGE_PATH}
            download
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 py-3 text-sm font-semibold transition-colors"
          >
            <IconDownload className="w-5 h-5" />
            下載完整 package（離線 / 手動部署）
          </a>
        </div>
        <div className="px-6 pb-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeployButton({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);

  const handleClick = useCallback(async () => {
    setOpen(true);
    try {
      await navigator.clipboard.writeText(AI_AGENT_INSTALL_CMD);
    } catch {
      /* modal still shows command */
    }
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        一鍵部署到公司內部
      </button>
      <DeployModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
