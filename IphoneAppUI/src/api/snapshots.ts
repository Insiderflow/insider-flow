import type { DashboardPayload, IndustryCompareSide, IndustryDetailPayload, Period } from '@/data/mockData';
import type { DataMode } from '@/context/DataModeContext';
import type { LiveFeedResponse, SearchResult } from '@/api/endpoints';
import type {
  InsiderCompanyProfile,
  InsiderEntityProfile,
} from '@/data/insiderEntities';
import type { IssuerProfile } from '@/data/issuerProfile';

import manifest from '@/data/snapshots/manifest.json';

const dashboardModules = import.meta.glob<DashboardPayload>(
  '../data/snapshots/dashboard-*.json',
  { eager: true, import: 'default' }
);

const liveModules = import.meta.glob<LiveFeedResponse>('../data/snapshots/live-*.json', {
  eager: true,
  import: 'default',
});

const profileModules = import.meta.glob<
  InsiderEntityProfile | InsiderCompanyProfile
>('../data/snapshots/profiles/*.json', { eager: true, import: 'default' });

const issuerModules = import.meta.glob<IssuerProfile>(
  '../data/snapshots/issuers/*.json',
  { eager: true, import: 'default' }
);

type SearchSnapshotFile = Record<string, { results: SearchResult[] }>;

const searchModules = import.meta.glob<SearchSnapshotFile>(
  '../data/snapshots/search.json',
  { eager: true, import: 'default' }
);

const industryModules = import.meta.glob<IndustryDetailPayload>(
  '../data/snapshots/industry/*.json',
  { eager: true, import: 'default' }
);

export const snapshotMeta = manifest as {
  generatedAt: string;
  apiBase: string;
  profileManifest?: { persons: string[]; companies: string[]; issuers?: string[] };
};

export function hasSnapshots(): boolean {
  return Object.keys(dashboardModules).length > 0;
}

function dashboardKey(mode: DataMode, period: Period) {
  return `dashboard-${mode}-${period}.json`;
}

export function getSnapshotDashboard(
  mode: DataMode,
  period: Period
): DashboardPayload | null {
  const suffix = dashboardKey(mode, period);
  const entry = Object.entries(dashboardModules).find(([path]) => path.endsWith(suffix));
  const raw = entry ? entry[1] : null;
  return raw ?? null;
}

function industrySnapshotSuffix(sector: string, side: IndustryCompareSide, period: Period) {
  const safe = sector.replace(/[^a-zA-Z0-9_-]+/g, '_');
  return `industry/${safe}-${side}-${period}.json`;
}

export function getSnapshotIndustryDetail(
  sector: string,
  side: IndustryCompareSide,
  period: Period
): IndustryDetailPayload | null {
  const suffix = industrySnapshotSuffix(sector, side, period);
  const entry = Object.entries(industryModules).find(([path]) => path.endsWith(suffix));
  return entry ? entry[1] : null;
}

export function getSnapshotLive(mode: DataMode): LiveFeedResponse | null {
  const suffix = `live-${mode}.json`;
  const entry = Object.entries(liveModules).find(([path]) => path.endsWith(suffix));
  return entry ? entry[1] : null;
}

export function getSnapshotProfile(
  routeId: string
): InsiderEntityProfile | InsiderCompanyProfile | null {
  const suffix = `/profiles/${routeId}.json`;
  const entry = Object.entries(profileModules).find(([path]) => path.endsWith(suffix));
  return entry ? (entry[1] as InsiderEntityProfile | InsiderCompanyProfile) : null;
}

/** Person pages linked from company snapshots (no dedicated person-*.json file). */
export function getSnapshotPersonProfile(routeId: string): InsiderEntityProfile | null {
  const direct = getSnapshotProfile(routeId);
  if (direct?.entityType === 'person') {
    return { ...direct, id: routeId } as InsiderEntityProfile;
  }

  const personId = routeId.startsWith('person-') ? routeId : `person-${routeId}`;

  for (const company of Object.values(profileModules)) {
    const c = company as InsiderCompanyProfile;
    if (c.entityType !== 'company' || !c.insiders?.length) continue;

    const insider = c.insiders.find((i) => i.id === personId || i.id === routeId);
    if (!insider) continue;

    const trades = (c.companyTrades || []).filter(
      (t) => t.personId === personId || t.personId === routeId
    );
    const buys = trades.filter((t) => t.side === 'buy');
    const sells = trades.filter((t) => t.side !== 'buy');

    return {
      id: personId,
      entityType: 'person',
      name: insider.name,
      ticker: c.ticker,
      companyName: c.companyName || c.name,
      roles: [insider.role],
      logoLabel: insider.name.slice(0, 2).toUpperCase(),
      logoColor: '#6366F1',
      allTradesCount: insider.tradesCount || trades.length,
      activity: {
        totalBuys: buys.reduce((s, t) => s + t.amount, 0),
        buyTxCount: buys.length,
        totalSells: sells.reduce((s, t) => s + t.amount, 0),
        sellTxCount: sells.length,
        totalOptions: 0,
        optionTxCount: 0,
        plan10b5TxCount: 0,
        plan10b5Pct: 0,
        avgBuy: 0,
        avgSell: 0,
      },
      eventStudies: [],
      recentTrades: trades.map((t) => ({
        id: t.id,
        ticker: t.ticker,
        side: t.side,
        amount: t.amount,
        shares: t.shares,
        filedAt: t.filedAt,
        tradeDate: t.tradeDate,
      })),
    };
  }

  return null;
}

export function getSnapshotIssuerProfile(
  idOrTicker: string
): IssuerProfile | null {
  const key = idOrTicker.trim();
  const byId = Object.entries(issuerModules).find(([path]) =>
    path.endsWith(`/issuers/${key}.json`)
  );
  if (byId) return byId[1];

  const upper = key.toUpperCase();
  for (const profile of Object.values(issuerModules)) {
    if (profile.id === key) return profile;
    if (profile.ticker?.toUpperCase() === upper) return profile;
  }
  return null;
}

const NAVIGABLE_SEARCH_TYPES = new Set([
  'politician',
  'issuer',
  'company',
  'owner',
]);

function normalizeSearchTerm(q: string) {
  return q.trim().toLowerCase();
}

function matchesSearchQuery(item: SearchResult, q: string) {
  const nq = normalizeSearchTerm(q);
  const hay = `${item.title} ${item.subtitle} ${item.id}`.toLowerCase();
  return hay.includes(nq);
}

/** Search frozen snapshots: search.json + issuer/person/company profiles. */
export function searchSnapshotIndex(q: string): SearchResult[] {
  const nq = normalizeSearchTerm(q);
  if (nq.length < 2) return [];

  const seen = new Set<string>();
  const out: SearchResult[] = [];

  const push = (item: SearchResult) => {
    if (!NAVIGABLE_SEARCH_TYPES.has(item.type)) return;
    const key = `${item.type}-${item.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  };

  const searchFile = Object.values(searchModules)[0];
  if (searchFile) {
    for (const entry of Object.values(searchFile)) {
      for (const row of entry.results || []) {
        if (matchesSearchQuery(row, q)) push(row);
      }
    }
  }

  for (const issuer of Object.values(issuerModules)) {
    const ticker = issuer.ticker?.toUpperCase() || '';
    const hay = `${issuer.name} ${ticker} ${issuer.sector || ''} ${issuer.id}`.toLowerCase();
    if (!hay.includes(nq)) continue;
    push({
      id: issuer.id,
      type: 'issuer',
      title: issuer.name,
      subtitle: `${ticker ? `$${ticker}` : '無代碼'} • ${issuer.sector || '—'} • ${issuer.stats.trades} 筆交易`,
      url: `/issuers/${issuer.id}`,
    });
  }

  for (const profile of Object.values(profileModules)) {
    const p = profile as InsiderEntityProfile | InsiderCompanyProfile;
    if (p.entityType === 'person' && !p.id.startsWith('person-')) {
      const hay = `${p.name} ${p.ticker || ''} ${p.companyName || ''}`.toLowerCase();
      if (!hay.includes(nq)) continue;
      push({
        id: p.id,
        type: 'politician',
        title: p.name,
        subtitle: p.ticker ? `$${p.ticker}` : '議員',
        url: `/insider/person/${p.id}`,
      });
    } else if (p.entityType === 'company') {
      const c = p as InsiderCompanyProfile;
      const hay = `${c.displayName || c.name} ${c.ticker}`.toLowerCase();
      if (!hay.includes(nq)) continue;
      push({
        id: c.id,
        type: 'company',
        title: c.displayName || c.name,
        subtitle: `$${c.ticker} • Form 4`,
        url: `/insider/company/${c.id}`,
      });
    }
  }

  const exactTicker = out.filter((r) =>
    r.subtitle.toUpperCase().includes(`$${q.trim().toUpperCase()}`)
  );
  const rest = out.filter((r) => !exactTicker.includes(r));
  return [...exactTicker, ...rest].slice(0, 15);
}

/** @deprecated use searchSnapshotIndex */
export function getSnapshotSearch(q: string): SearchResult[] {
  return searchSnapshotIndex(q);
}
