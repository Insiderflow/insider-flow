import { prisma } from "@/lib/prisma";

const LOOKBACK_DAYS = 14;
const MAX_SIGNALS = 120;
const READ_ALERT_RETENTION_DAYS = 45;
const SYNC_CONCURRENCY = 8;

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

  return { syncedUsers };
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
