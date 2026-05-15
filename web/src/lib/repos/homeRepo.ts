import { getGlobalLatestTradeActivity } from '@/lib/tradeActivity';
import { prisma } from '@/lib/prisma';

export type HomeLatestTrade = {
  id: string;
  type: string;
  tradedAt: Date;
  publishedAt: Date | null;
  sizeMin: number | null;
  sizeMax: number | null;
  price: number | null;
  politician: {
    id: string;
    name: string;
    party: string | null;
    state: string | null;
  };
  issuer: {
    id: string;
    name: string;
    ticker: string | null;
  };
};

export async function getHomePageStats() {
  const [tradeCount, politicianCount, issuerCount, lastTradeDate] = await Promise.all([
    prisma.trade.count(),
    prisma.politician.count(),
    prisma.issuer.count(),
    getGlobalLatestTradeActivity(),
  ]);

  return { tradeCount, politicianCount, issuerCount, lastTradeDate };
}

export async function getLatestTradesForHome(limit = 10): Promise<HomeLatestTrade[]> {
  const rows = await prisma.trade.findMany({
    orderBy: [{ traded_at: 'desc' }, { published_at: 'desc' }],
    take: limit,
    include: { Politician: true, Issuer: true },
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    tradedAt: row.traded_at,
    publishedAt: row.published_at,
    sizeMin: row.size_min ? Number(row.size_min) : null,
    sizeMax: row.size_max ? Number(row.size_max) : null,
    price: row.price ? Number(row.price) : null,
    politician: {
      id: row.Politician.id,
      name: row.Politician.name,
      party: row.Politician.party,
      state: row.Politician.state,
    },
    issuer: {
      id: row.Issuer.id,
      name: row.Issuer.name,
      ticker: row.Issuer.ticker,
    },
  }));
}
