import { sendEmail } from './email';
import { prisma } from './prisma';

interface TradeData {
  politician: {
    name: string;
    id: string;
  };
  issuer: {
    name: string;
  };
  type: string;
  tradedAt: string;
}

interface WeeklyDigestData {
  totalTrades: number;
  activePoliticians: number;
  totalVolume: string;
}

interface NotificationData {
  type: 'newTrade' | 'watchlistUpdate' | 'weeklyDigest';
  data: TradeData | WeeklyDigestData;
}

export async function sendNotificationToUsers(notification: NotificationData) {
  try {
    // Get all users who have the specific notification enabled
    const users = await prisma.user.findMany({
      where: {
        email_verified: true,
        notification_settings: {
          path: [getNotificationPath(notification.type)],
          equals: true,
        },
      },
    });

    // Send email to each user
    for (const user of users) {
      await sendNotificationEmail(user.email, notification);
    }

    console.log(`Sent ${notification.type} notification to ${users.length} users`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

function getNotificationPath(type: string): string {
  switch (type) {
    case 'newTrade':
      return 'newTrades';
    case 'watchlistUpdate':
      return 'watchlistUpdates';
    case 'weeklyDigest':
      return 'weeklyDigest';
    default:
      return 'newTrades';
  }
}

async function sendNotificationEmail(email: string, notification: NotificationData) {
  const subject = getEmailSubject(notification.type);
  const content = getEmailContent(notification);

  await sendEmail(email, subject, content);
}

function getEmailSubject(type: string): string {
  switch (type) {
    case 'newTrade':
      return '新交易通知 - InsiderFlow';
    case 'watchlistUpdate':
      return '觀察名單更新 - InsiderFlow';
    case 'weeklyDigest':
      return '週報摘要 - InsiderFlow';
    default:
      return '通知 - InsiderFlow';
  }
}

function getEmailContent(notification: NotificationData): string {
  switch (notification.type) {
    case 'newTrade':
      return `
        <h2>新交易通知</h2>
        <p>有新交易被記錄：</p>
        <ul>
          ${(notification.data as any).politician?.name ? `<li>交易者: ${(notification.data as any).politician.name}</li>` : ''}
          ${(notification.data as any).owner?.name ? `<li>內部人: ${(notification.data as any).owner.name}</li>` : ''}
          ${(notification.data as any).issuer?.name ? `<li>發行商: ${(notification.data as any).issuer.name}</li>` : ''}
          ${(notification.data as any).issuer?.ticker ? `<li>股票代碼: ${(notification.data as any).issuer.ticker}</li>` : ''}
          <li>類型: ${(notification.data as TradeData).type}</li>
          <li>交易日期: ${(notification.data as TradeData).tradedAt}</li>
        </ul>
        <p><a href="https://insiderflow.com/trades">查看所有交易</a></p>
      `;
    
    case 'watchlistUpdate':
      return `
        <h2>觀察名單更新</h2>
        <p>您關注的對象有新交易：</p>
        <ul>
          ${(notification.data as any).politician?.name ? `<li>政治家: ${(notification.data as any).politician.name}</li>` : ''}
          ${(notification.data as any).owner?.name ? `<li>內部人: ${(notification.data as any).owner.name}</li>` : ''}
          ${(notification.data as any).issuer?.name ? `<li>發行商: ${(notification.data as any).issuer.name}</li>` : ''}
          ${(notification.data as any).issuer?.ticker ? `<li>股票代碼: ${(notification.data as any).issuer.ticker}</li>` : ''}
          <li>類型: ${(notification.data as TradeData).type}</li>
          <li>交易日期: ${(notification.data as TradeData).tradedAt}</li>
        </ul>
        ${((notification.data as any).politician?.id ? `<p><a href="https://insiderflow.com/politicians/${(notification.data as any).politician.id}">查看政治家詳情</a></p>` : '')}
      `;
    
    case 'weeklyDigest':
      return `
        <h2>週報摘要</h2>
        <p>本週交易統計：</p>
        <ul>
          <li>總交易數: ${(notification.data as WeeklyDigestData).totalTrades}</li>
          <li>活躍政治家: ${(notification.data as WeeklyDigestData).activePoliticians}</li>
          <li>交易金額: $${(notification.data as WeeklyDigestData).totalVolume}</li>
        </ul>
        <p><a href="https://insiderflow.com">查看完整統計</a></p>
      `;
    
    default:
      return '<p>您收到一個新通知</p>';
  }
}

// Helper function to send notification when a new trade is added
export async function notifyNewTrade(trade: TradeData) {
  await sendNotificationToUsers({
    type: 'newTrade',
    data: {
      politician: { name: trade.politician.name, id: trade.politician.id },
      issuer: { name: trade.issuer.name },
      type: trade.type,
      tradedAt: trade.tradedAt,
    },
  });
}

// Helper function to process a new trade and send appropriate notifications
export async function processNewTrade(trade: TradeData) {
  try {
    console.log(`Processing new trade: ${trade.politician.name} - ${trade.issuer.name}`);
    
    // Send general new trade notifications to all users who want them
    await notifyNewTrade(trade);
    
    // Send watchlist notifications to users who watch this specific politician
    await notifyWatchlistUpdate(trade);
    
    console.log(`✅ Completed notifications for trade: ${trade.politician.name}`);
  } catch (error) {
    console.error('Error processing new trade notifications:', error);
  }
}

// Helper function to send notification for watchlist updates
export async function notifyWatchlistUpdate(trade: TradeData) {
  try {
    // Politician-based
    const usersByPolitician = await prisma.user.findMany({
      where: {
        email_verified: true,
        notification_settings: { path: ['watchlistUpdates'], equals: true },
        UserWatchlist: { some: { watchlist_type: 'politician', politician_id: (trade as any).politician?.id } },
      },
      select: { email: true },
    });

    // Company-based (issuer)
    const usersByCompany = await prisma.user.findMany({
      where: {
        email_verified: true,
        notification_settings: { path: ['watchlistUpdates'], equals: true },
        UserWatchlist: { some: { watchlist_type: 'company', company_id: (trade as any).issuer?.id } },
      },
      select: { email: true },
    });

    // Owner-based (insider)
    const usersByOwner = await prisma.user.findMany({
      where: {
        email_verified: true,
        notification_settings: { path: ['watchlistUpdates'], equals: true },
        UserWatchlist: { some: { watchlist_type: 'owner', owner_id: (trade as any).owner?.id } },
      },
      select: { email: true },
    });

    // Ticker-based
    const usersByTicker = await prisma.user.findMany({
      where: {
        email_verified: true,
        notification_settings: { path: ['watchlistUpdates'], equals: true },
        UserWatchlist: { some: { watchlist_type: 'stock', ticker: (trade as any).issuer?.ticker } },
      },
      select: { email: true },
    });

    const emails = Array.from(new Set([
      ...usersByPolitician.map(u => u.email),
      ...usersByCompany.map(u => u.email),
      ...usersByOwner.map(u => u.email),
      ...usersByTicker.map(u => u.email),
    ].filter(Boolean)));

    for (const email of emails) {
      await sendNotificationEmail(email, {
        type: 'watchlistUpdate',
        data: {
          politician: (trade as any).politician ? { name: (trade as any).politician.name, id: (trade as any).politician.id } : undefined,
          owner: (trade as any).owner ? { name: (trade as any).owner.name, id: (trade as any).owner.id } : undefined,
          issuer: (trade as any).issuer ? { name: (trade as any).issuer.name, id: (trade as any).issuer.id, ticker: (trade as any).issuer.ticker } : undefined,
          type: (trade as any).type,
          tradedAt: (trade as any).tradedAt,
        } as any,
      });
    }

    console.log(`Sent watchlist notifications for trade to ${emails.length} users`);
  } catch (error) {
    console.error('Error sending watchlist notifications:', error);
  }
}
