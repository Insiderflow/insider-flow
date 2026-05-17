import type { WatchlistItem } from "@/api/endpoints";
import {
  companyPathFromTicker,
  personPathFromOwnerId,
} from "@/data/insiderEntities";
import type { WatchlistType } from "@/api/services/watchlist";

type ApiPolitician = { id: string; name: string; party?: string | null; state?: string | null };
type ApiCompany = { id: string; name?: string | null; ticker?: string | null };
type ApiOwner = { id: string; name?: string | null };

export type WatchlistRow = {
  id: string;
  type: WatchlistType;
  title: string;
  subtitle: string;
  path: string;
  target: {
    type: WatchlistType;
    politicianId?: string;
    companyId?: string;
    ownerId?: string;
    ticker?: string;
  };
};

function normalizeType(raw: string): WatchlistType {
  if (raw === "ticker") return "stock";
  if (raw === "politician" || raw === "company" || raw === "owner" || raw === "stock") {
    return raw;
  }
  return "stock";
}

export function watchlistRowFromItem(item: WatchlistItem & {
  Politician?: ApiPolitician | null;
  Company?: ApiCompany | null;
  Owner?: ApiOwner | null;
  sector?: string | null;
}): WatchlistRow | null {
  const type = normalizeType(item.watchlist_type);

  if (type === "politician" && item.politician_id) {
    const p = item.Politician;
    const party = p?.party?.trim();
    const state = p?.state?.trim();
    const subtitle = [party, state, item.sector].filter(Boolean).join(" · ") || "—";
    return {
      id: item.id,
      type,
      title: p?.name || item.display_name || item.politician_id,
      subtitle,
      path: `/insider/person/${item.politician_id}`,
      target: { type, politicianId: item.politician_id },
    };
  }

  if (type === "company" && item.company_id) {
    const c = item.Company;
    const ticker = c?.ticker?.toUpperCase() || item.ticker?.toUpperCase();
    return {
      id: item.id,
      type,
      title: c?.name || item.display_name || ticker || item.company_id,
      subtitle: ticker ? `$${ticker}` : "Form 4",
      path: ticker
        ? companyPathFromTicker(ticker)
        : `/insider/company/${item.company_id}`,
      target: { type, companyId: item.company_id, ticker: ticker || undefined },
    };
  }

  if (type === "owner" && item.owner_id) {
    const o = item.Owner;
    return {
      id: item.id,
      type,
      title: o?.name || item.display_name || item.owner_id,
      subtitle: item.ticker ? `$${item.ticker.toUpperCase()}` : "Insider",
      path: personPathFromOwnerId(item.owner_id),
      target: { type, ownerId: item.owner_id, ticker: item.ticker || undefined },
    };
  }

  if (type === "stock" && item.ticker) {
    const ticker = item.ticker.toUpperCase();
    return {
      id: item.id,
      type,
      title: ticker,
      subtitle: item.display_name || "Stock",
      path: companyPathFromTicker(ticker),
      target: { type, ticker },
    };
  }

  return null;
}

export function watchlistRowsFromItems(items: WatchlistItem[]): WatchlistRow[] {
  return items
    .map((item) => watchlistRowFromItem(item as WatchlistItem & {
      Politician?: ApiPolitician | null;
      Company?: ApiCompany | null;
      Owner?: ApiOwner | null;
      sector?: string | null;
    }))
    .filter((row): row is WatchlistRow => row !== null);
}
