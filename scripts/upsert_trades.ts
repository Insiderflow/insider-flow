import { PrismaClient } from '../generated/prisma';

type TradeRow = {
  tradeId: string;
  politicianId: string;
  politicianName: string;
  issuerId: string;
  issuerName: string;
  ticker?: string | null;
  publishedAt?: string | null;
  tradedAt?: string | null;
  filedAfterDays?: number | null;
  owner?: string | null;
  type?: 'buy' | 'sell' | null;
  sizeMin?: number | null;
  sizeMax?: number | null;
  price?: number | null;
  detailUrl: string;
};

const prisma = new PrismaClient();

async function upsertBatch(rows: TradeRow[]) {
  for (const r of rows) {
    // Upsert Politician
    await prisma.politician.upsert({
      where: { id: r.politicianId },
      create: {
        id: r.politicianId,
        name: r.politicianName,
      },
      update: {
        name: r.politicianName,
      },
    });

    // Upsert Issuer
    await prisma.issuer.upsert({
      where: { id: r.issuerId },
      create: {
        id: r.issuerId,
        name: r.issuerName,
        ticker: r.ticker ?? undefined,
      },
      update: {
        name: r.issuerName,
        ticker: r.ticker ?? undefined,
      },
    });

    // Upsert Trade
    await prisma.trade.upsert({
      where: { id: r.tradeId },
      create: {
        id: r.tradeId,
        politicianId: r.politicianId,
        issuerId: r.issuerId,
        publishedAt: r.publishedAt ? new Date(r.publishedAt) : undefined,
        tradedAt: r.tradedAt ? new Date(r.tradedAt) : new Date(),
        filedAfterDays: r.filedAfterDays ?? undefined,
        owner: r.owner ?? undefined,
        type: r.type ?? 'buy',
        sizeMin: r.sizeMin != null ? r.sizeMin.toString() : undefined,
        sizeMax: r.sizeMax != null ? r.sizeMax.toString() : undefined,
        price: r.price != null ? r.price.toString() : undefined,
        sourceUrl: r.detailUrl,
        raw: r as any,
      },
      update: {
        publishedAt: r.publishedAt ? new Date(r.publishedAt) : undefined,
        tradedAt: r.tradedAt ? new Date(r.tradedAt) : undefined,
        filedAfterDays: r.filedAfterDays ?? undefined,
        owner: r.owner ?? undefined,
        type: r.type ?? undefined,
        sizeMin: r.sizeMin != null ? r.sizeMin.toString() : undefined,
        sizeMax: r.sizeMax != null ? r.sizeMax.toString() : undefined,
        price: r.price != null ? r.price.toString() : undefined,
        sourceUrl: r.detailUrl,
        raw: r as any,
      },
    });
  }
}

async function main() {
  const input = await new Promise<string>((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });

  const rows: TradeRow[] = JSON.parse(input);
  await upsertBatch(rows);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


