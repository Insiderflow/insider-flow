import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

/**
 * Example output snippet (schema-only; numbers are computed from your refreshData() run).
 *
 * Politicians shown: Ro Khanna, Nancy Pelosi, Michael McCaul, Maria Elvira Salazar,
 * Gilbert Cisneros, Josh Gottheimer, Lisa McClain, Markwayne Mullin.
 *
 * Note: `lastTradeDate`, `tradeCountInSector`, and `totalVolumeInSector` are derived
 * from your trade dataset (and will differ by refresh time).
 */
export const POLITICIANS_BY_SECTOR_EXAMPLE = {
  sectors: {
    "Information Technology": [
      {
        name: "Ro Khanna",
        title: "Rep. Ro Khanna (D-CA)",
        party: "D",
        chamber: "House",
        state: "CA",
        tradeCountInSector: 0,
        lastTradeDate: null,
        totalVolumeInSector: 0,
      },
    ],
  },
  allPoliticians: [
    {
      name: "Ro Khanna",
      title: "Rep. Ro Khanna (D-CA)",
      party: "D",
      chamber: "House",
      state: "CA",
      sectors: ["Information Technology"],
      totalTrades: 0,
    },
  ],
  metadata: {
    totalPoliticians: 0,
    totalTrades: 0,
    lastUpdated: "2026-04-29",
    dataSource: "Quiver Quantitative + Capitol Trades",
  },
} as const;

export const SECTOR_NAMES = [
  "Information Technology",
  "Financials",
  "Industrials",
  "Health Care",
  "Consumer Discretionary",
  "Communication Services",
  "Consumer Staples",
  "Energy",
  "Materials",
  "Real Estate",
  "Utilities",
] as const;

export type SectorName = (typeof SECTOR_NAMES)[number];

export type PartyAbbrev = "D" | "R" | "I" | "U";

export type PoliticianSectorStats = {
  name: string;
  title: string; // e.g. "Rep. Ro Khanna (D-CA)"
  party: PartyAbbrev;
  chamber: "House" | "Senate" | "Unknown";
  state: string; // "CA" or "Unknown"
  tradeCountInSector: number;
  lastTradeDate: string | null; // "YYYY-MM-DD"
  totalVolumeInSector: number; // numeric USD estimate derived from size range
};

export type SectorBucket = PoliticianSectorStats[];

export type PoliticiansBySectorSnapshot = {
  sectors: Record<SectorName, SectorBucket>;
  allPoliticians: Array<{
    name: string;
    title: string;
    party: PartyAbbrev;
    chamber: "House" | "Senate" | "Unknown";
    state: string; // "CA" or "Unknown"
    sectors: SectorName[];
    totalTrades: number;
  }>;
  metadata: {
    totalPoliticians: number;
    totalTrades: number;
    lastUpdated: string; // "YYYY-MM-DD"
    dataSource: string;
  };
};

/**
 * Sector-scoped politician stats entry (the objects inside `snapshot.sectors[sectorName]`).
 */
export type Politician = PoliticiansBySectorSnapshot["sectors"][SectorName][number];

type LoadTradeRow = {
  traded_at: Date;
  size_min: unknown; // Prisma Decimal | number | null (keep unknown -> normalize at runtime)
  size_max: unknown; // Prisma Decimal | number | null (keep unknown -> normalize at runtime)
  Issuer: {
    ticker: string | null;
    sector: string | null;
  };
  Politician: {
    id: string;
    name: string;
    party: string | null;
    chamber: string | null;
    state: string | null;
  };
};

type FinnhubCompanyProfile2 = {
  // Finnhub naming: gsector/ggroup/gind/gsubind
  gsector?: string | null;
  ggroup?: string | null;
  // other fields omitted
};

type RefreshOptions = {
  /**
   * If true, will call Finnhub for tickers whose issuer.sector is missing or
   * doesn't normalize into one of the 11 target GICS sectors.
   *
   * If FINNHUB_API_KEY is not set, this falls back to "no network calls".
   *
   * Default: true
   */
  fetchMissingSectors?: boolean;
  /**
   * Maximum Finnhub tickers to resolve in a single refresh run.
   * Default: 500
   */
  maxFinnhubTickers?: number;
};

const SNAPSHOT_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const LOCK_KEY = BigInt("91327200981"); // stable advisory lock key

const CACHE_DIR = path.join(process.cwd(), ".cache");
const SNAPSHOT_PATH = path.join(CACHE_DIR, "politiciansBySector.snapshot.json");

const DEFAULT_REFRESH_OPTIONS: Required<Pick<RefreshOptions, "fetchMissingSectors" | "maxFinnhubTickers">> = {
  fetchMissingSectors: true,
  maxFinnhubTickers: 500,
};

const normalizeKey = (value: string): string =>
  value
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();

const normalizeParty = (raw: string | null | undefined): PartyAbbrev => {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return "U";
  if (s.startsWith("dem")) return "D";
  if (s.startsWith("rep")) return "R";
  if (s.startsWith("ind")) return "I";
  // If you store "D"/"R" already, accept it:
  if (s === "d") return "D";
  if (s === "r") return "R";
  if (s === "i" || s === "independent") return "I";
  return "U";
};

const normalizeChamber = (raw: string | null | undefined): "House" | "Senate" | "Unknown" => {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return "Unknown";
  if (s.startsWith("house")) return "House";
  if (s.startsWith("senate")) return "Senate";
  return "Unknown";
};

const normalizeState = (raw: string | null | undefined): string => {
  const s = (raw ?? "").trim();
  if (!s) return "Unknown";
  return s.toUpperCase();
};

const formatTitle = (politicianName: string, party: PartyAbbrev, chamber: "House" | "Senate" | "Unknown", state: string): string => {
  const prefix = chamber === "Senate" ? "Sen." : chamber === "House" ? "Rep." : "Rep./Sen.";
  return `${prefix} ${politicianName} (${party}-${state})`;
};

/**
 * Normalize any GICS-ish sector string into one of our EXACT 11 sector names.
 *
 * IMPORTANT: this never "guesses" beyond normalization of known representations:
 * - Finnhub: e.g. "Information Technology"
 * - Your CSVs may contain compact forms like "InformationTechnology".
 */
export function normalizeToTargetSector(sector: string | null | undefined): SectorName | null {
  if (!sector) return null;
  const key = normalizeKey(sector);

  // Identity / direct matches:
  if (key === normalizeKey("Information Technology")) return "Information Technology";
  if (key === normalizeKey("Financials")) return "Financials";
  if (key === normalizeKey("Industrials")) return "Industrials";
  if (key === normalizeKey("Health Care")) return "Health Care";
  if (key === normalizeKey("Consumer Discretionary")) return "Consumer Discretionary";
  if (key === normalizeKey("Communication Services")) return "Communication Services";
  if (key === normalizeKey("Consumer Staples")) return "Consumer Staples";
  if (key === normalizeKey("Energy")) return "Energy";
  if (key === normalizeKey("Materials")) return "Materials";
  if (key === normalizeKey("Real Estate")) return "Real Estate";
  if (key === normalizeKey("Utilities")) return "Utilities";

  // Common compact representations from some datasets:
  if (key === "informationtechnology") return "Information Technology";
  if (key === "healthcare") return "Health Care";
  if (key === "consumerdiscretionary") return "Consumer Discretionary";
  if (key === "communicationservices") return "Communication Services";
  if (key === "consumerstaples") return "Consumer Staples";
  if (key === "reestate") return "Real Estate";
  if (key === "realestate") return "Real Estate";

  return null;
}

const decimalToNumber = (value: unknown): number => {
  if (value == null) return 0;
  // Prisma Decimal has toString() and valueOf(): keep it robust.
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") return Number.isFinite(Number(value)) ? Number(value) : 0;
  const n = Number(
    (value as { toNumber?: () => number }).toNumber?.() ??
      (value as { toString: () => string }).toString?.(),
  );
  return Number.isFinite(n) ? n : 0;
};

/**
 * Deterministic volume estimate from your stored trade fields.
 *
 * Your trade dataset stores a transaction size RANGE (size_min/size_max).
 * We use size_max as a conservative "upper bound" estimate.
 */
function computeTradeVolumeUSD(trade: LoadTradeRow): number {
  // Use size_max if available; fallback to size_min.
  const max = decimalToNumber(trade.size_max);
  if (max > 0) return max;
  const min = decimalToNumber(trade.size_min);
  return min > 0 ? min : 0;
}

async function tryAcquireLock() {
  const rows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_lock(${LOCK_KEY}) AS locked;
  `;
  return rows[0]?.locked === true;
}

async function releaseLock() {
  await prisma.$queryRaw`
    SELECT pg_advisory_unlock(${LOCK_KEY});
  `;
}

async function readSnapshotFromDisk(): Promise<PoliticiansBySectorSnapshot | null> {
  try {
    const stat = await fs.stat(SNAPSHOT_PATH);
    if (!stat.isFile()) return null;
    if (Date.now() - stat.mtimeMs > SNAPSHOT_TTL_MS) return null;
    const content = await fs.readFile(SNAPSHOT_PATH, "utf8");
    return JSON.parse(content) as PoliticiansBySectorSnapshot;
  } catch {
    return null;
  }
}

async function writeSnapshotToDisk(snapshot: PoliticiansBySectorSnapshot): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf8");
}

function emptySnapshot(): PoliticiansBySectorSnapshot {
  const sectors = {} as Record<SectorName, SectorBucket>;
  for (const s of SECTOR_NAMES) {
    sectors[s] = [];
  }

  return {
    sectors,
    allPoliticians: [],
    metadata: {
      totalPoliticians: 0,
      totalTrades: 0,
      lastUpdated: new Date().toISOString().slice(0, 10),
      dataSource: "Quiver Quantitative + Capitol Trades",
    },
  };
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchFinnhubProfile2(symbol: string): Promise<FinnhubCompanyProfile2 | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;

  // Finnhub stock profile v2 endpoint:
  // GET https://finnhub.io/api/v1/stock/profile2?symbol={SYMBOL}&token={token}
  const url = new URL("https://finnhub.io/api/v1/stock/profile2");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("token", apiKey);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Accept": "application/json" },
    // Node-side requests only.
  });

  if (!res.ok) {
    return null;
  }
  const json = (await res.json()) as FinnhubCompanyProfile2 & Record<string, unknown>;
  return json;
}

/**
 * Resolves sector mapping for tickers we can't normalize from your local dataset.
 *
 * If Finnhub is unavailable or FINNHUB_API_KEY isn't set, returns an empty map.
 */
async function resolveMissingSectorsWithFinnhub(tickers: string[], maxTickers: number): Promise<Map<string, SectorName>> {
  const out = new Map<string, SectorName>();
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return out;
  if (!tickers.length) return out;

  const unique = Array.from(new Set(tickers)).slice(0, maxTickers);
  for (const symbol of unique) {
    // basic guard: skip index/treasury proxies that usually don't map to GICS equities
    if (!symbol || symbol.startsWith("^")) continue;

    // Finnhub rate limiting: be conservative (no parallel).
    // Adjust if your plan allows more.
    await sleep(300);

    const profile = await fetchFinnhubProfile2(symbol);
    const gsector = profile?.gsector ?? null;
    const normalized = normalizeToTargetSector(gsector);
    if (normalized) out.set(symbol, normalized);
  }
  return out;
}

function buildSnapshotFromTrades(trades: LoadTradeRow[], tickerSectorOverrides: Map<string, SectorName>): PoliticiansBySectorSnapshot {
  const snap = emptySnapshot();

  let skippedTradesNoSector = 0;
  const skippedTickersNoSector = new Set<string>();

  type SectorAgg = {
    tradeCountInSector: number;
    lastTradeDate: Date | null;
    totalVolumeInSector: number;
  };

  type PoliticianAgg = {
    politicianId: string;
    name: string;
    party: PartyAbbrev;
    chamber: "House" | "Senate" | "Unknown";
    state: string;
    totalTradesWithSector: number;
    sectors: Map<SectorName, SectorAgg>;
  };

  const politicians = new Map<string, PoliticianAgg>();

  const getOrCreatePolitician = (p: LoadTradeRow["Politician"]): PoliticianAgg => {
    const existing = politicians.get(p.id);
    if (existing) return existing;
    const party = normalizeParty(p.party);
    const chamber = normalizeChamber(p.chamber);
    const state = normalizeState(p.state);
    const agg: PoliticianAgg = {
      politicianId: p.id,
      name: p.name,
      party,
      chamber,
      state,
      totalTradesWithSector: 0,
      sectors: new Map(),
    };
    politicians.set(p.id, agg);
    return agg;
  };

  // Accumulate
  for (const t of trades) {
    const pAgg = getOrCreatePolitician(t.Politician);

    const rawSector = t.Issuer.sector;
    const normalizedFromIssuer = normalizeToTargetSector(rawSector);

    // Overrides: ticker -> SectorName (e.g. Finnhub fetched)
    const ticker = t.Issuer.ticker;
    const normalizedFromOverride = ticker ? tickerSectorOverrides.get(ticker) ?? null : null;

    const sector = normalizedFromOverride ?? normalizedFromIssuer;
    if (!sector) {
      // Skip tickers with no GICS mapping (per requirement).
      skippedTradesNoSector += 1;
      if (t.Issuer.ticker) skippedTickersNoSector.add(t.Issuer.ticker);
      continue;
    }

    pAgg.totalTradesWithSector += 1;

    const current = pAgg.sectors.get(sector) ?? {
      tradeCountInSector: 0,
      lastTradeDate: null,
      totalVolumeInSector: 0,
    };

    current.tradeCountInSector += 1;
    if (!current.lastTradeDate || t.traded_at > current.lastTradeDate) {
      current.lastTradeDate = t.traded_at;
    }
    current.totalVolumeInSector += computeTradeVolumeUSD(t);

    pAgg.sectors.set(sector, current);
  }

  // Materialize sectors -> arrays of stats
  for (const sectorName of SECTOR_NAMES) {
    const arr: PoliticianSectorStats[] = [];

    for (const pAgg of politicians.values()) {
      const sectorAgg = pAgg.sectors.get(sectorName);
      if (!sectorAgg) continue;

      arr.push({
        name: pAgg.name,
        title: formatTitle(pAgg.name, pAgg.party, pAgg.chamber, pAgg.state),
        party: pAgg.party,
        chamber: pAgg.chamber,
        state: pAgg.state,
        tradeCountInSector: sectorAgg.tradeCountInSector,
        lastTradeDate: sectorAgg.lastTradeDate ? sectorAgg.lastTradeDate.toISOString().slice(0, 10) : null,
        totalVolumeInSector: sectorAgg.totalVolumeInSector,
      });
    }

    // Sort by tradeCount first, then latest trade date.
    arr.sort((a, b) => {
      if (b.tradeCountInSector !== a.tradeCountInSector) return b.tradeCountInSector - a.tradeCountInSector;
      const ad = a.lastTradeDate ? Date.parse(a.lastTradeDate) : -Infinity;
      const bd = b.lastTradeDate ? Date.parse(b.lastTradeDate) : -Infinity;
      return bd - ad;
    });

    snap.sectors[sectorName] = arr;
  }

  // Materialize allPoliticians
  const all: PoliticiansBySectorSnapshot["allPoliticians"] = [];
  let totalTrades = 0;

  for (const pAgg of politicians.values()) {
    const sectors = Array.from(pAgg.sectors.keys());
    if (!sectors.length) continue;

    const totalTradesForPolitician = pAgg.totalTradesWithSector;
    totalTrades += totalTradesForPolitician;

    all.push({
      name: pAgg.name,
      title: formatTitle(pAgg.name, pAgg.party, pAgg.chamber, pAgg.state),
      party: pAgg.party,
      chamber: pAgg.chamber,
      state: pAgg.state,
      sectors: sectors.sort((x, y) => SECTOR_NAMES.indexOf(x) - SECTOR_NAMES.indexOf(y)),
      totalTrades: totalTradesForPolitician,
    });
  }

  all.sort((a, b) => {
    if (b.totalTrades !== a.totalTrades) return b.totalTrades - a.totalTrades;
    return a.name.localeCompare(b.name);
  });

  snap.allPoliticians = all;
  snap.metadata.totalPoliticians = all.length;
  snap.metadata.totalTrades = totalTrades;
  snap.metadata.lastUpdated = new Date().toISOString().slice(0, 10);
  snap.metadata.dataSource = "Quiver Quantitative + Capitol Trades";

  if (skippedTradesNoSector > 0) {
    // Not part of the output JSON shape; we log for ops visibility.
    console.warn(
      `[politiciansBySector] skippedTradesNoSector=${skippedTradesNoSector} (tickers=${Array.from(skippedTickersNoSector).slice(0, 20).join(", ")})`,
    );
  }

  return snap;
}

async function loadTradesWithinLast3Years(): Promise<LoadTradeRow[]> {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 3);

  const trades = await prisma.trade.findMany({
    where: { traded_at: { gte: cutoff } },
    select: {
      traded_at: true,
      size_min: true,
      size_max: true,
      Issuer: {
        select: {
          ticker: true,
          sector: true,
        },
      },
      Politician: {
        select: {
          id: true,
          name: true,
          party: true,
          chamber: true,
          state: true,
        },
      },
    },
  });

  // Runtime shape matches our LoadTradeRow type (`Issuer`/`Politician`).
  return trades as unknown as LoadTradeRow[];
}

async function collectTickersNeedingSectorMapping(trades: LoadTradeRow[]): Promise<string[]> {
  const tickers = new Set<string>();
  for (const t of trades) {
    const normalizedFromIssuer = normalizeToTargetSector(t.Issuer.sector);
    if (normalizedFromIssuer) continue;
    const ticker = t.Issuer.ticker;
    if (!ticker) continue;
    if (ticker.startsWith("^")) continue;
    tickers.add(ticker);
  }
  return Array.from(tickers);
}

/**
 * refreshData:
 * Recomputes your full politicians -> EXACT 11 GICS sector breakdown from your stored trade dataset.
 *
 * What it does:
 * 1) Loads all trades in the last 3 years (by `trade.traded_at`).
 * 2) For each trade, normalizes `issuer.sector` into one of the EXACT 11 sectors.
 * 3) Optionally resolves missing/un-normalizable tickers via Finnhub company profile2:
 *    - Requires `FINNHUB_API_KEY`
 *    - Uses GICS sector field `gsector`
 *
 * Rate limits & errors:
 * - Finnhub calls are performed sequentially with a conservative delay (see `sleep(300)`).
 * - If FINNHUB_API_KEY is not set, we skip Finnhub resolution and only use stored `issuer.sector`.
 * - Tickes that still cannot map to one of the 11 sectors are skipped (and logged to console).
 *
 * Scheduling:
 * - Since this function is based on your already-imported trade dataset, you typically schedule it
 *   daily after your scraper/import jobs run.
 * - Cron/GitHub Actions/Render Scheduler can call an API route or server action that invokes refreshData().
 *   (No route is provided in this file; wire it up in your app as needed.)
 *
 * Edge cases:
 * - Spouses/dependents / late filings: included as long as they appear in your trade dataset and fall in the 3-year window.
 * - Duplicate politician names: grouping uses `politician.id` so same-name different people remain separate.
 */
export async function refreshData(options?: RefreshOptions): Promise<void> {
  const opts = { ...DEFAULT_REFRESH_OPTIONS, ...(options ?? {}) };

  const locked = await tryAcquireLock();
  if (!locked) {
    // Another refresh run is in progress.
    return;
  }

  try {
    const snapshot = await (async () => {
      const trades = await loadTradesWithinLast3Years();

      let tickerSectorOverrides = new Map<string, SectorName>();
      if (opts.fetchMissingSectors) {
        const tickers = await collectTickersNeedingSectorMapping(trades);
        const overrides = await resolveMissingSectorsWithFinnhub(tickers, opts.maxFinnhubTickers);
        tickerSectorOverrides = overrides;
      }

      return buildSnapshotFromTrades(trades, tickerSectorOverrides);
    })();

    await writeSnapshotToDisk(snapshot);
  } finally {
    await releaseLock();
  }
}

async function getSnapshotOrRefresh(): Promise<PoliticiansBySectorSnapshot> {
  const cached = await readSnapshotFromDisk();
  if (cached) return cached;
  await refreshData();
  const fresh = await readSnapshotFromDisk();
  if (!fresh) {
    // As a last resort, build in-memory.
    const trades = await loadTradesWithinLast3Years();
    return buildSnapshotFromTrades(trades, new Map());
  }
  return fresh;
}

/**
 * getPoliticiansBySector:
 * Returns all politicians categorized into the provided EXACT 11 sector name.
 */
export async function getPoliticiansBySector(sectorName: string): Promise<Politician[]> {
  const snapshot = await getSnapshotOrRefresh();
  const matched = SECTOR_NAMES.find((s) => s.toLowerCase() === sectorName.trim().toLowerCase());
  if (!matched) return [];
  return snapshot.sectors[matched];
}

/**
 * getSectorsForPolitician:
 * Finds a politician by name (case-insensitive exact match) and returns their sector list.
 *
 * Edge case: duplicate politician names.
 * This will return the union of sectors across all matching entries.
 */
export async function getSectorsForPolitician(politicianName: string): Promise<string[]> {
  const snapshot = await getSnapshotOrRefresh();
  const q = politicianName.trim().toLowerCase();
  const matches = snapshot.allPoliticians.filter((p) => p.name.trim().toLowerCase() === q);
  const out = new Set<SectorName>();
  for (const m of matches) {
    for (const s of m.sectors) out.add(s);
  }
  return Array.from(out);
}

