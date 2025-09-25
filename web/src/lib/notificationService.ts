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
        emailVerified: true,
        notificationSettings: {
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
        <p>有新的國會議員交易被記錄：</p>
        <ul>
          <li>政治家: ${notification.data.politicianName}</li>
          <li>發行商: ${notification.data.issuerName}</li>
          <li>類型: ${notification.data.type}</li>
          <li>交易日期: ${notification.data.tradedAt}</li>
        </ul>
        <p><a href="https://insiderflow.com/trades">查看所有交易</a></p>
      `;
    
    case 'watchlistUpdate':
      return `
        <h2>觀察名單更新</h2>
        <p>您關注的政治家 ${notification.data.politicianName} 有新交易：</p>
        <ul>
          <li>發行商: ${notification.data.issuerName}</li>
          <li>類型: ${notification.data.type}</li>
          <li>交易日期: ${notification.data.tradedAt}</li>
        </ul>
        <p><a href="https://insiderflow.com/politicians/${notification.data.politicianId}">查看政治家詳情</a></p>
      `;
    
    case 'weeklyDigest':
      return `
        <h2>週報摘要</h2>
        <p>本週交易統計：</p>
        <ul>
          <li>總交易數: ${notification.data.totalTrades}</li>
          <li>活躍政治家: ${notification.data.activePoliticians}</li>
          <li>交易金額: $${notification.data.totalVolume}</li>
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
      politicianName: trade.politician.name,
      issuerName: trade.issuer.name,
      type: trade.type,
      tradedAt: trade.tradedAt,
    },
  });
}

// Helper function to send notification for watchlist updates
export async function notifyWatchlistUpdate(trade: TradeData, _userId: string) {
  await sendNotificationToUsers({
    type: 'watchlistUpdate',
    data: {
      politicianName: trade.politician.name,
      politicianId: trade.politician.id,
      issuerName: trade.issuer.name,
      type: trade.type,
      tradedAt: trade.tradedAt,
    },
  });
}
