/**
 * Insider Flow — API Adapter (public surface)
 * All page-level data should go through this module.
 */

import {
  mapPoliticianTrades,
  mapCorporateTrades,
  mapOITransactions,
  mapOICompanies,
  mapOIOwners,
  mapWatchlistItems,
  mapWatchlistItem,
  mapAlerts,
  mapPoliticianSearchResult,
  mapIssuerSearchResult,
} from './mappers';
import {
  dashboardEndpoints,
  politicianEndpoints,
  corporateEndpoints,
  openInsiderEndpoints,
  watchlistEndpoints,
  searchEndpoints,
  alertEndpoints,
} from './endpoints';
import { appClient } from '@/api/appClient';
import {
  MOCK_POLITICIAN_TRADES,
  MOCK_CORPORATE_TRADES,
  MOCK_OPEN_INSIDER_TRANSACTIONS,
  MOCK_OI_COMPANIES,
  MOCK_OI_OWNERS,
  MOCK_DASHBOARD_STATS,
  MOCK_ALERTS,
} from './mockData';

const USE_MOCK = false;

const delay = (ms = 350) => new Promise(r => setTimeout(r, ms));

export async function getDashboardStats() {
  if (USE_MOCK) { await delay(); return MOCK_DASHBOARD_STATS; }
  try {
    return await dashboardEndpoints.getStats();
  } catch {
    return MOCK_DASHBOARD_STATS;
  }
}

export async function getPoliticianTrades({ limit = 50 } = {}) {
  if (USE_MOCK) { await delay(); return mapPoliticianTrades(MOCK_POLITICIAN_TRADES.slice(0, limit)); }
  const raw = await politicianEndpoints.listTrades({ limit, sort: '-trade_date' });
  return mapPoliticianTrades(raw);
}

export async function getPoliticianTradesByName(name) {
  if (USE_MOCK) {
    await delay();
    return mapPoliticianTrades(MOCK_POLITICIAN_TRADES.filter(t => t.politician_name === name));
  }
  const raw = await politicianEndpoints.getTradesByName(name);
  return mapPoliticianTrades(raw);
}

/**
 * Returns politicians pre-filtered/aggregated into one of the 11 GICS sectors.
 * Output is already in mobile-friendly shape (name/title/party/chamber/state + trade counts).
 */
export async function getPoliticiansBySector(sector) {
  if (USE_MOCK) {
    await delay();
    // fall back to existing mock search results shape if MOCK ever enabled
    return [];
  }
  const res = await politicianEndpoints.getPoliticiansBySector(sector);
  return res?.politicians || [];
}

export async function getUniquePoliticians() {
  const trades = await getPoliticianTrades({ limit: 200 });
  const seen = new Set();
  return trades.filter(t => {
    if (seen.has(t.politician_name)) return false;
    seen.add(t.politician_name);
    return true;
  });
}

export async function getCorporateTrades({ limit = 50 } = {}) {
  if (USE_MOCK) { await delay(); return mapCorporateTrades(MOCK_CORPORATE_TRADES.slice(0, limit)); }
  const raw = await corporateEndpoints.listTrades({ limit, sort: '-trade_date' });
  return mapCorporateTrades(raw);
}

export async function getIssuerTrades(ticker) {
  if (USE_MOCK) {
    await delay();
    return {
      politicianTrades: mapPoliticianTrades(MOCK_POLITICIAN_TRADES.filter(t => t.ticker === ticker)),
      corporateTrades:  mapCorporateTrades(MOCK_CORPORATE_TRADES.filter(t => t.ticker === ticker)),
    };
  }
  const [pRaw, cRaw] = await Promise.all([
    politicianEndpoints.listTrades({ ticker }),
    corporateEndpoints.listTrades({ ticker }),
  ]);
  return {
    politicianTrades: mapPoliticianTrades(pRaw),
    corporateTrades:  mapCorporateTrades(cRaw),
  };
}

export async function getOpenInsiderTransactions({ limit = 100 } = {}) {
  if (USE_MOCK) { await delay(); return mapOITransactions(MOCK_OPEN_INSIDER_TRANSACTIONS.slice(0, limit)); }
  const raw = await openInsiderEndpoints.listTransactions({ limit });
  return mapOITransactions(raw);
}

export async function getOpenInsiderCompanies({ limit = 100 } = {}) {
  if (USE_MOCK) { await delay(); return mapOICompanies(MOCK_OI_COMPANIES.slice(0, limit)); }
  const raw = await openInsiderEndpoints.listCompanies({ limit });
  return mapOICompanies(raw);
}

export async function getOpenInsiderOwners({ limit = 100 } = {}) {
  if (USE_MOCK) { await delay(); return mapOIOwners(MOCK_OI_OWNERS.slice(0, limit)); }
  const raw = await openInsiderEndpoints.listOwners({ limit });
  return mapOIOwners(raw);
}

function toWatchlistPayload(data) {
  const payload = { type: data.type };
  if (data.type === 'politician') payload.politicianId = data.identifier;
  if (data.type === 'politician') payload.politicianName = data.label;
  if (data.type === 'company') payload.companyId = data.identifier;
  if (data.type === 'owner') payload.ownerId = data.identifier;
  if (data.type === 'ticker' || data.type === 'stock') payload.ticker = data.identifier;
  return payload;
}

export async function getWatchlistItems() {
  try {
    const response = await watchlistEndpoints.getItems();
    return mapWatchlistItems(response.watchlist || []);
  } catch {
    const fallback = await appClient.entities.WatchlistItem.list();
    return mapWatchlistItems(fallback || []);
  }
}

export async function addToWatchlist(data) {
  try {
    const raw = await watchlistEndpoints.addItem(toWatchlistPayload(data));
    return mapWatchlistItem(raw.watchlistItem);
  } catch {
    const created = await appClient.entities.WatchlistItem.create(toWatchlistPayload(data));
    return mapWatchlistItem(created);
  }
}

export async function removeFromWatchlist(id) {
  try {
    const all = await getWatchlistItems();
    const target = all.find((i) => i.id === id);
    if (!target) return;
    const params = { type: target.type };
    if (target.type === 'politician') params.politicianId = target.identifier;
    if (target.type === 'company') params.companyId = target.identifier;
    if (target.type === 'owner') params.ownerId = target.identifier;
    if (target.type === 'ticker' || target.type === 'stock') params.ticker = target.identifier;
    return watchlistEndpoints.removeItem(params);
  } catch {
    return appClient.entities.WatchlistItem.delete(id);
  }
}

export async function getWatchlistItem(type, identifier) {
  const normalizedType = type === 'stock' ? 'ticker' : type;
  const idNeedle = String(identifier || '').toLowerCase();
  const all = await getWatchlistItems();
  const directMatch = all.find(
    (item) =>
      item.type === normalizedType &&
      String(item.identifier || '').toLowerCase() === idNeedle,
  );
  if (directMatch) return directMatch;
  if (normalizedType === 'politician') {
    return all.find(
      (item) =>
        item.type === 'politician' &&
        String(item.label || '').toLowerCase() === idNeedle,
    ) || null;
  }
  return null;
}

export async function getAlerts() {
  if (USE_MOCK) {
    await delay(200);
    return mapAlerts(MOCK_ALERTS);
  }
  const raw = await alertEndpoints.list();
  return mapAlerts(raw);
}

export async function markAlertRead(_id) {
  if (USE_MOCK) {
    await delay(100);
    return;
  }
  return alertEndpoints.markRead(_id);
}

export async function markAllAlertsRead() {
  if (USE_MOCK) {
    await delay(100);
    return;
  }
  return alertEndpoints.markAllRead();
}

export async function getAlertsUnreadCount() {
  if (USE_MOCK) {
    await delay(100);
    return 0;
  }
  const result = await alertEndpoints.unreadCount();
  return Number(result?.unreadCount || 0);
}

export async function getAllTradesForSearch() {
  const [politicians, corporate] = await Promise.all([
    getPoliticianTrades({ limit: 200 }),
    getCorporateTrades({ limit: 200 }),
  ]);
  return { politicians, corporate };
}

/**
 * Build deduplicated politician and issuer suggestion lists from cached trade data.
 * Used by the Search page when the real /api/suggest/* routes aren't live yet.
 */
export async function getSearchSuggestions(q = '') {
  if (!USE_MOCK) {
    const [politicianSuggest, issuerSuggest] = await Promise.all([
      searchEndpoints.suggestPoliticians(q),
      searchEndpoints.suggestIssuers(q),
    ]);

    const politicians = (politicianSuggest.names || []).map((name) =>
      mapPoliticianSearchResult({
        id: name,
        name,
        politician_name: name,
      }),
    );

    const issuers = (issuerSuggest.names || []).map((nameWithTicker) => {
      const match = /^(.+?)\s+\(([^)]+)\)$/.exec(nameWithTicker);
      return mapIssuerSearchResult({
        ticker: match?.[2] || '',
        company_name: match?.[1] || nameWithTicker,
      });
    });

    return { politicians, issuers };
  }

  const { politicians, corporate } = await getAllTradesForSearch();
  const query = q.toLowerCase();

  // Unique politicians
  const polMap = new Map();
  politicians.forEach(t => {
    if (!polMap.has(t.politician_name)) {
      polMap.set(t.politician_name, mapPoliticianSearchResult({
        ...t,
        id: t.politician_name,
        name: t.politician_name,
        last_trade_date: t.trade_date,
      }));
    }
  });

  // Unique issuers
  const issuerMap = new Map();
  [...politicians, ...corporate].forEach(t => {
    if (!issuerMap.has(t.ticker)) {
      issuerMap.set(t.ticker, mapIssuerSearchResult({
        ...t,
        last_trade_date: t.trade_date,
      }));
    }
  });

  const polList = [...polMap.values()].filter(p =>
    !query || p.name.toLowerCase().includes(query)
  );
  const issuerList = [...issuerMap.values()].filter(i =>
    !query ||
    i.ticker.toLowerCase().includes(query) ||
    i.company_name.toLowerCase().includes(query)
  );

  return { politicians: polList, issuers: issuerList };
}