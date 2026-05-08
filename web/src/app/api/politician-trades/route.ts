import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';
import fs from 'fs/promises';
import path from 'path';
import { sectorToZh } from '@/lib/sectorI18n';

const DASHBOARD_TTL_MS = 30_000;
const DASHBOARD_DISK_TTL_MS = 5 * 60_000;
const responseCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_FILE = path.join(process.cwd(), '.cache', 'politician-trades-dashboard.json');

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
  return rawType.toLowerCase().includes('sell') ? 'Sell' : 'Buy';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || '100'), 500);
    const politician = searchParams.get('politician');
    const ticker = searchParams.get('ticker');
    const sort = searchParams.get('sort') || '';
    const isDashboardFastPath = !politician && !ticker && limit <= 20 && sort === '-trade_date';
    const cacheKey = `politician:${limit}:${sort}`;

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

    const rows = await prisma.trade.findMany({
      where: {
        ...(politician ? { Politician: { name: { contains: politician, mode: 'insensitive' } } } : {}),
        ...(ticker ? { Issuer: { ticker: { equals: ticker, mode: 'insensitive' } } } : {}),
      },
      include: {
        Politician: true,
        Issuer: true,
      },
      orderBy: { traded_at: 'desc' },
      take: limit,
    });

    const origin = new URL(req.url).origin;
    const data = rows.map((row) => ({
      id: row.id,
      politician_name: row.Politician?.name || '',
      politician_id: row.Politician?.id || '',
      party: row.Politician?.party || 'Independent',
      chamber: row.Politician?.chamber || 'House',
      state: row.Politician?.state || '',
      ticker: row.Issuer?.ticker || '',
      company_name: row.Issuer?.name || '',
      trade_type: normalizeTradeType(row.type),
      amount_range:
        row.size_min && row.size_max
          ? `$${Number(row.size_min).toLocaleString()} - $${Number(row.size_max).toLocaleString()}`
          : row.size_max
            ? `$${Number(row.size_max).toLocaleString()}`
            : 'Unknown',
      trade_date: row.traded_at.toISOString().slice(0, 10),
      disclosure_date: row.published_at?.toISOString().slice(0, 10) || row.traded_at.toISOString().slice(0, 10),
      sector: sectorToZh(row.Issuer?.sector) || '',
      committees: row.Politician?.committees || '',
      notable: Number(row.size_max || 0) >= 1000000,
      avatar_url:
        row.Politician?.id && row.Politician?.name
          ? `${origin}${getPoliticianImageSrc(row.Politician.id, row.Politician.name)}`
          : null,
    }));

    if (isDashboardFastPath) {
      responseCache.set(cacheKey, { data, expiresAt: Date.now() + DASHBOARD_TTL_MS });
      await writeDashboardCacheToDisk(cacheKey, data);
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('politician-trades error', error);
    return NextResponse.json({ error: 'Failed to fetch politician trades' }, { status: 500 });
  }
}

