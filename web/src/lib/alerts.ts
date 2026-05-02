import { prisma } from "@/lib/prisma";
import type { SectorName } from "@/lib/politiciansBySector";
import {
  inferSeatSectorFromCommittees,
  resolveIssuerTradeSector,
  resolvePoliticianCommittees,
} from "@/lib/seatSector";

const LOOKBACK_DAYS = 14;
const MAX_SIGNALS = 120;
const MAX_SEAT_ALIGNED_TRADES = 120;
const READ_ALERT_RETENTION_DAYS = 45;
const SYNC_CONCURRENCY = 8;
const ALERT_CREATE_CHUNK = 2000;

function startLookbackDate() {
  return new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
}

function formatPoliticianTitle(name: string, ticker: string, tradeType: string) {
  return `${name} ${tradeType.toUpperCase()} ${ticker}`;
}

function formatPoliticianBody(companyName: string, tradedAt: Date) {
  return `${companyName} trade disclosed from ${tradedAt.toISOString().slice(0, 10)}.`;
}

function formatCorporateTitle(ownerName: string, ticker: string, transactionType: string) {
  return `${ownerName} ${transactionType} ${ticker}`;
}

function formatCorporateBody(companyName: string, tradeDate: Date) {
  return `${companyName} insider transaction filed for ${tradeDate.toISOString().slice(0, 10)}.`;
}

function formatSeatAlignmentTitle(name: string, ticker: string, tradeType: string, sector: string) {
  return `Seat-sector match: ${name} ${tradeType.toUpperCase()} ${ticker} (${sector})`;
}

function formatSeatAlignmentBody(companyName: string, tradedAt: Date, sector: string) {
  return `${companyName} (${sector}) overlaps this member’s committee focus — disclosed ${tradedAt.toISOString().slice(0, 10)}.`;
}

/**
 * Paid subscribers: alert when a politician’s committee-inferred seat sector matches the issuer GICS sector
 * (e.g. Intel committee member buys a Communication Services stock only if seat maps to that sector too).
 *
 * Populate `Politician.committees` (or `src/data/politician_committees.seed.json` keyed by politician id) so
 * seat sectors can be inferred. Issuer sector uses DB `Issuer.sector` with ticker fallbacks for major names.
 */
export async function syncSeatAlignmentAlertsForPaidUsers() {
  const since = startLookbackDate();
  const now = new Date();

  const paidUsers = await prisma.user.findMany({
    where: {
      membership_tier: "PAID",
      OR: [{ membership_expires_at: null }, { membership_expires_at: { gt: now } }],
    },
    select: { id: true },
  });
  const paidIds = paidUsers.map((u) => u.id);
  if (!paidIds.length) return { inserted: 0 };

  const trades = await prisma.trade.findMany({
    where: { traded_at: { gte: since } },
    include: {
      Politician: { select: { id: true, name: true, committees: true } },
      Issuer: { select: { ticker: true, name: true, sector: true } },
    },
    orderBy: { traded_at: "desc" },
    take: 600,
  });

  const aligned: Array<{ trade: (typeof trades)[number]; sector: SectorName }> = [];
  for (const t of trades) {
    const committees = resolvePoliticianCommittees(t.Politician.id, t.Politician.committees);
    const seat = inferSeatSectorFromCommittees(committees);
    const tradeSector = resolveIssuerTradeSector(t.Issuer.ticker, t.Issuer.sector);
    if (seat && tradeSector && seat === tradeSector) {
      aligned.push({ trade: t, sector: tradeSector });
      if (aligned.length >= MAX_SEAT_ALIGNED_TRADES) break;
    }
  }

  if (!aligned.length) return { inserted: 0 };

  const rows = aligned.flatMap(({ trade: t, sector }) =>
    paidIds.map((user_id) => ({
      user_id,
      source_key: `seat_align:${t.id}`,
      type: "seat_alignment" as const,
      title: formatSeatAlignmentTitle(
        t.Politician?.name || "Politician",
        t.Issuer?.ticker || "-",
        t.type,
        sector,
      ),
      body: formatSeatAlignmentBody(t.Issuer?.name || "Unknown issuer", t.traded_at, sector),
      ticker: t.Issuer?.ticker ?? null,
      timestamp: t.traded_at,
    })),
  );

  let inserted = 0;
  for (let i = 0; i < rows.length; i += ALERT_CREATE_CHUNK) {
    const chunk = rows.slice(i, i + ALERT_CREATE_CHUNK);
    const result = await prisma.alert.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    inserted += result.count;
  }

  return { inserted };
}

export async function syncUserAlerts(userId: string) {
  const watchlist = await prisma.userWatchlist.findMany({
    where: { user_id: userId },
    select: {
      watchlist_type: true,
      politician_id: true,
      company_id: true,
      owner_id: true,
      ticker: true,
    },
  });

  if (!watchlist.length) return;

  const politicianIds = watchlist
    .filter((w) => w.watchlist_type === "politician" && w.politician_id)
    .map((w) => w.politician_id as string);
  const companyIds = watchlist
    .filter((w) => w.watchlist_type === "company" && w.company_id)
    .map((w) => w.company_id as string);
  const ownerIds = watchlist
    .filter((w) => w.watchlist_type === "owner" && w.owner_id)
    .map((w) => w.owner_id as string);
  const stockTickers = watchlist
    .filter((w) => (w.watchlist_type === "stock" || w.watchlist_type === "ticker") && w.ticker)
    .map((w) => (w.ticker as string).toUpperCase());

  const since = startLookbackDate();

  if (politicianIds.length || stockTickers.length) {
    const matchedTrades = await prisma.trade.findMany({
      where: {
        traded_at: { gte: since },
        OR: [
          ...(politicianIds.length ? [{ politician_id: { in: politicianIds } }] : []),
          ...(stockTickers.length ? [{ Issuer: { ticker: { in: stockTickers } } }] : []),
        ],
      },
      include: {
        Politician: { select: { name: true } },
        Issuer: { select: { ticker: true, name: true } },
      },
      orderBy: { traded_at: "desc" },
      take: MAX_SIGNALS,
    });

    await prisma.alert.createMany({
      data: matchedTrades.map((trade) => ({
        user_id: userId,
        source_key: `trade:${trade.id}`,
        type: "watchlist",
        title: formatPoliticianTitle(
          trade.Politician?.name || "Politician",
          trade.Issuer?.ticker || "-",
          trade.type,
        ),
        body: formatPoliticianBody(trade.Issuer?.name || "Unknown issuer", trade.traded_at),
        ticker: trade.Issuer?.ticker || null,
        timestamp: trade.traded_at,
      })),
      skipDuplicates: true,
    });
  }

  if (companyIds.length || ownerIds.length || stockTickers.length) {
    const matchedTransactions = await prisma.openInsiderTransaction.findMany({
      where: {
        tradeDate: { gte: since },
        OR: [
          ...(companyIds.length ? [{ companyId: { in: companyIds } }] : []),
          ...(ownerIds.length ? [{ ownerId: { in: ownerIds } }] : []),
          ...(stockTickers.length ? [{ company: { ticker: { in: stockTickers } } }] : []),
        ],
      },
      include: {
        company: { select: { ticker: true, name: true } },
        owner: { select: { name: true } },
      },
      orderBy: { tradeDate: "desc" },
      take: MAX_SIGNALS,
    });

    await prisma.alert.createMany({
      data: matchedTransactions.map((transaction) => ({
        user_id: userId,
        source_key: `oi:${transaction.id}`,
        type: "corporate",
        title: formatCorporateTitle(
          transaction.owner?.name || "Insider",
          transaction.company?.ticker || "-",
          transaction.transactionType,
        ),
        body: formatCorporateBody(transaction.company?.name || "Unknown company", transaction.tradeDate),
        ticker: transaction.company?.ticker || null,
        timestamp: transaction.tradeDate,
      })),
      skipDuplicates: true,
    });
  }
}

export async function syncAllUserAlerts() {
  const seatAlignment = await syncSeatAlignmentAlertsForPaidUsers();

  const usersWithWatchlist = await prisma.userWatchlist.findMany({
    select: { user_id: true },
    distinct: ["user_id"],
  });

  let syncedUsers = 0;
  let cursor = 0;
  while (cursor < usersWithWatchlist.length) {
    const batch = usersWithWatchlist.slice(cursor, cursor + SYNC_CONCURRENCY);
    await Promise.all(batch.map((row) => syncUserAlerts(row.user_id)));
    syncedUsers += batch.length;
    cursor += SYNC_CONCURRENCY;
  }

  return { syncedUsers, seatAlignmentInserted: seatAlignment.inserted };
}

export async function pruneOldReadAlerts(retentionDays = READ_ALERT_RETENTION_DAYS) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await prisma.alert.deleteMany({
    where: {
      read: true,
      timestamp: { lt: cutoff },
    },
  });
  return { deletedAlerts: result.count, cutoff };
}
