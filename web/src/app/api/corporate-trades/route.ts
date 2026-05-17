import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isOpenInsiderSell } from '@/lib/openInsiderTransaction';
import fs from 'fs/promises';
import path from 'path';

const DASHBOARD_TTL_MS = 30_000;
const DASHBOARD_DISK_TTL_MS = 5 * 60_000;
const responseCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_FILE = path.join(process.cwd(), '.cache', 'corporate-trades-dashboard.json');

async function readDashboardCacheFromDisk(cacheKey: string): Promise<unknown | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as {
      key?: string;
      data?: unknown;
      expiresAt?: number;
    };
    if (!parsed || parsed.key !== cacheKey) return null;
    if (!parsed.expiresAt || parsed.expiresAt <= Date.now()) return null;
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

async function writeDashboardCacheToDisk(cacheKey: string, data: unknown): Promise<void> {
  try {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(
      CACHE_FILE,
      JSON.stringify({
        key: cacheKey,
        expiresAt: Date.now() + DASHBOARD_DISK_TTL_MS,
        data,
      }),
      'utf8',
    );
  } catch {
    // non-fatal cache write failure
  }
}

function normalizeTradeType(rawType: string): 'Buy' | 'Sell' {
  return isOpenInsiderSell(rawType) ? 'Sell' : 'Buy';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 500);
    const ticker = searchParams.get('ticker');
    const sort = searchParams.get('sort') || '';
    const isDashboardFastPath = !ticker && limit <= 20 && sort === '-trade_date';
    const cacheKey = `corporate:${limit}:${sort}`;

    if (isDashboardFastPath) {
      const hit = responseCache.get(cacheKey);
      if (hit && hit.expiresAt > Date.now()) {
        return NextResponse.json(hit.data);
      }
      const diskHit = await readDashboardCacheFromDisk(cacheKey);
      if (diskHit) {
        responseCache.set(cacheKey, { data: diskHit, expiresAt: Date.now() + DASHBOARD_TTL_MS });
        return NextResponse.json(diskHit);
      }
    }

    const rows = await prisma.openInsiderTransaction.findMany({
      where: {
        ...(ticker
          ? {
              company: {
                ticker: { equals: ticker, mode: 'insensitive' },
              },
            }
          : {}),
      },
      include: {
        company: true,
        owner: true,
      },
      orderBy: { transactionDate: 'desc' },
      take: limit,
    });

    const data = rows.map((row) => ({
      id: row.id,
      insider_name: row.owner?.name || '',
      title: row.owner?.title || '',
      ticker: row.company?.ticker || '',
      company_name: row.company?.name || '',
      trade_type: normalizeTradeType(row.transactionType),
      shares: Number(row.quantity.replace(/[^0-9.-]/g, '') || '0'),
      price_per_share: Number(row.lastPrice || 0),
      total_value: Number(row.valueNumeric || 0),
      trade_date: row.tradeDate.toISOString().slice(0, 10),
      filing_date: row.transactionDate.toISOString().slice(0, 10),
      sector: '',
      ownership_change_pct: 0,
      notable: Number(row.valueNumeric || 0) >= 1000000,
    }));

    if (isDashboardFastPath) {
      responseCache.set(cacheKey, { data, expiresAt: Date.now() + DASHBOARD_TTL_MS });
      await writeDashboardCacheToDisk(cacheKey, data);
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('corporate-trades error', error);
    return NextResponse.json({ error: 'Failed to fetch corporate trades' }, { status: 500 });
  }
}

