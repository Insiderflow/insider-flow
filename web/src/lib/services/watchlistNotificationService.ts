import { createUnsubscribeLink, sendWatchlistTradeEmail } from '@/lib/email';
import {
  createWatchlistAlertIfNotExists,
  getRecentTradesForNotification,
} from '@/lib/repos/notificationRepo';
import { getWatchlistUsersByPolitician } from '@/lib/repos/watchlistRepo';

function formatTradeSize(sizeMin: unknown, sizeMax: unknown) {
  const min = sizeMin ? Number(sizeMin) : null;
  const max = sizeMax ? Number(sizeMax) : null;
  if (min && max) return `$${Math.round(min).toLocaleString('en-US')} - $${Math.round(max).toLocaleString('en-US')}`;
  if (min) return `$${Math.round(min).toLocaleString('en-US')}`;
  if (max) return `$${Math.round(max).toLocaleString('en-US')}`;
  return '未披露';
}

export async function sendWatchlistNotificationsForTrade(trade: {
  id: string;
  traded_at: Date;
  type: string;
  size_min: unknown;
  size_max: unknown;
  Politician: { id: string; name: string };
  Issuer: { id: string; name: string; ticker: string | null };
}) {
  const users = await getWatchlistUsersByPolitician(trade.Politician.id);
  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    const dedupe = await createWatchlistAlertIfNotExists({
      userId: user.id,
      tradeId: trade.id,
      politicianName: trade.Politician.name,
      issuerName: trade.Issuer.name,
      tradeType: trade.type,
      tradedAt: trade.traded_at,
    });
    if (!dedupe.created) {
      skipped += 1;
      continue;
    }

    await sendWatchlistTradeEmail({
      to: user.email,
      politicianName: trade.Politician.name,
      politicianId: trade.Politician.id,
      issuerName: trade.Issuer.name,
      tradeType: trade.type,
      tradedAt: trade.traded_at,
      sizeText: formatTradeSize(trade.size_min, trade.size_max),
      unsubscribeLink: createUnsubscribeLink(user.id, 'watchlistUpdates'),
    });
    sent += 1;
  }

  return { sent, skipped, watchers: users.length };
}

export async function runWatchlistNotificationSweep(minutes = 30) {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  const trades = await getRecentTradesForNotification(since, 300);
  let sent = 0;
  let skipped = 0;

  for (const trade of trades) {
    const result = await sendWatchlistNotificationsForTrade(trade);
    sent += result.sent;
    skipped += result.skipped;
  }

  return {
    since,
    tradesScanned: trades.length,
    sent,
    skipped,
  };
}
