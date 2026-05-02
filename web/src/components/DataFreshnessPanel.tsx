'use client';

import { useEffect, useState } from 'react';
import { badgeStyles } from '@/components/badgeStyles';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { bodySubtextStyles, sectionTitleStyles } from '@/components/typographyStyles';

type FreshnessPayload = {
  ok: boolean;
  status: 'green' | 'yellow' | 'red';
  latest?: {
    traded_at: string | null;
    published_at: string | null;
    total_trades: number;
  };
  ages?: {
    traded_at_days: number | null;
    published_at_hours: number | null;
  };
};

function statusBadge(status: FreshnessPayload['status']) {
  if (status === 'green') return badgeStyles('success', 'sm');
  if (status === 'yellow') return badgeStyles('warning', 'sm');
  return badgeStyles('danger', 'sm');
}

function statusLabel(status: FreshnessPayload['status']) {
  if (status === 'green') return 'Healthy';
  if (status === 'yellow') return 'Warning';
  return 'Stale';
}

export default function DataFreshnessPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<FreshnessPayload | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/health/data-freshness', { cache: 'no-store' });
      const body = (await res.json()) as FreshnessPayload;
      if (!res.ok) {
        setError(body?.ok === false ? 'Data freshness check failed' : 'Failed to load freshness');
      }
      setData(body);
    } catch {
      setError('Failed to load freshness');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className={`mt-6 ${panelSurfaceStyles()}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={sectionTitleStyles()}>Data Freshness Status</h2>
        {data?.status && (
          <span className={statusBadge(data.status)}>{statusLabel(data.status)}</span>
        )}
      </div>

      {loading ? (
        <p className={`${bodySubtextStyles()} text-sm`}>Loading...</p>
      ) : error ? (
        <p className="text-red-300 text-sm">{error}</p>
      ) : (
        <div className="space-y-2 text-sm">
          <p className={bodySubtextStyles()}>
            Latest trade date: {data?.latest?.traded_at ? new Date(data.latest.traded_at).toLocaleString() : 'N/A'}
          </p>
          <p className={bodySubtextStyles()}>
            Latest disclosure date: {data?.latest?.published_at ? new Date(data.latest.published_at).toLocaleString() : 'N/A'}
          </p>
          <p className={bodySubtextStyles()}>
            Trade age: {data?.ages?.traded_at_days ?? 'N/A'} days
          </p>
          <p className={bodySubtextStyles()}>
            Disclosure age: {data?.ages?.published_at_hours ?? 'N/A'} hours
          </p>
          <p className={bodySubtextStyles()}>
            Total trades: {data?.latest?.total_trades ?? 0}
          </p>
        </div>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-600 text-gray-200 hover:bg-gray-700 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
