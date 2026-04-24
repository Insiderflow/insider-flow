'use client';

import { useEffect, useState } from 'react';

type AlertsSyncState = {
  inProgress: boolean;
  lastRunAt: string | null;
  lastResult: {
    syncedUsers: number;
    deletedOldReadAlerts: number;
    elapsedMs: number;
    retentionCutoff: string;
  } | null;
  lastError: string | null;
};

export default function AlertsSyncPanel() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<AlertsSyncState>({
    inProgress: false,
    lastRunAt: null,
    lastResult: null,
    lastError: null,
  });

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/account/alerts-sync', { cache: 'no-store' });
      if (res.status === 403) {
        setEnabled(false);
        return;
      }
      if (!res.ok) {
        setMessage('載入同步狀態失敗');
        return;
      }
      const data = await res.json();
      setState({
        inProgress: !!data.inProgress,
        lastRunAt: data.lastRunAt ?? null,
        lastResult: data.lastResult ?? null,
        lastError: data.lastError ?? null,
      });
    } catch {
      setMessage('載入同步狀態失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const runSync = async () => {
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/account/alerts-sync', { method: 'POST' });
      const data = await res.json();
      if (res.status === 202) {
        setMessage('同步已在進行中');
      } else if (!res.ok) {
        setMessage(data.error || '同步失敗');
      } else {
        setMessage('同步完成');
      }
      await loadStatus();
    } catch {
      setMessage('同步失敗');
    } finally {
      setSubmitting(false);
    }
  };

  if (!enabled) return null;

  return (
    <div className="mt-6 bg-gray-800 border border-gray-600 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Alerts 同步狀態</h2>
        <span
          className={`px-2 py-1 rounded text-xs ${
            state.inProgress ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-200'
          }`}
        >
          {state.inProgress ? '同步中' : '待命'}
        </span>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">載入中...</p>
      ) : (
        <div className="space-y-2 text-sm">
          <p className="text-gray-300">
            上次同步: {state.lastRunAt ? new Date(state.lastRunAt).toLocaleString('zh-TW') : '尚未同步'}
          </p>
          <p className="text-gray-300">
            同步用戶數: {state.lastResult?.syncedUsers ?? 0}
          </p>
          <p className="text-gray-300">
            清理舊通知: {state.lastResult?.deletedOldReadAlerts ?? 0}
          </p>
          <p className="text-gray-300">
            耗時: {state.lastResult?.elapsedMs ?? 0}ms
          </p>
          {state.lastError && <p className="text-red-300">上次錯誤: {state.lastError}</p>}
          {message && <p className="text-blue-300">{message}</p>}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={runSync}
          disabled={submitting || state.inProgress}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '同步中...' : '立即重試同步'}
        </button>
        <button
          type="button"
          onClick={loadStatus}
          disabled={loading}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          重新整理狀態
        </button>
      </div>
    </div>
  );
}
