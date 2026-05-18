import { prisma } from '@/lib/prisma';
import { openInsiderSide } from '@/lib/openInsiderTransaction';
import { politicianTradeSeatLabel } from '@/lib/mobile/politicianSeatLabel';
import { politicianTradeWhere } from '@/lib/mobile/tradeDateSanity';
import {
  computeInsiderNotableFlags,
  computePoliticianTradeFlags,
  fetchCongressClusterKeys,
} from '@/lib/mobile/tradeFlags';
import { getPoliticianImageSrc } from '@/lib/politicianImageMapping';

function partyCode(raw: string | null | undefined): 'R' | 'D' | 'I' {
  const p = (raw || '').toLowerCase();
  if (p.startsWith('r')) return 'R';
  if (p.startsWith('d')) return 'D';
  return 'I';
}

function tradeAmount(sizeMin: unknown, sizeMax: unknown): number {
  const max = Number(sizeMax || 0);
  const min = Number(sizeMin || 0);
  return max > 0 ? max : min;
}

export async function buildPoliticianLiveFeed() {
  const where = politicianTradeWhere();
  const [rows, clusterKeys] = await Promise.all([
    prisma.trade.findMany({
      where,
      include: { Politician: true, Issuer: true },
      orderBy: { traded_at: 'desc' },
      take: 80,
    }),
    fetchCongressClusterKeys(prisma, where),
  ]);

  const trades = rows.map((r) => {
    const sell = r.type.toLowerCase().includes('sell');
    const proposed = r.type.toLowerCase().includes('proposed');
    const ticker = r.Issuer?.ticker || '—';
    const seat = politicianTradeSeatLabel({
      politicianId: r.politician_id,
      committees: r.Politician?.committees,
      tradeTicker: r.Issuer?.ticker,
      issuerSector: r.Issuer?.sector,
    });
    const side = proposed ? 'proposed_sale' : sell ? 'sell' : 'buy';
    const amountUsd = tradeAmount(r.size_min, r.size_max);
    const flags = computePoliticianTradeFlags(
      {
        id: r.id,
        politicianId: r.politician_id,
        ticker,
        side,
        amountUsd,
        committees: r.Politician?.committees,
        issuerSector: r.Issuer?.sector,
      },
      clusterKeys,
    );
    return {
      id: r.id,
      ticker,
      displayName: r.Politician?.name || '',
      title: seat.title,
      titleKey: seat.titleKey,
      politicianId: r.politician_id,
      imageUrl: r.politician_id
        ? getPoliticianImageSrc(r.politician_id, r.Politician?.name || '')
        : undefined,
      showParty: true,
      party: partyCode(r.Politician?.party),
      side,
      flags,
      disclosureBadge: 'STOCK Act',
      metricLabel: 'holdings' as const,
      metricValue: ticker,
      filedDisplay: r.published_at?.toISOString().slice(0, 10) || r.traded_at.toISOString().slice(0, 10),
      priceDisplay: r.price ? `$${Number(r.price).toFixed(2)}` : '—',
      totalValueDisplay: `$${amountUsd.toLocaleString()}`,
      dateKey: r.traded_at.toISOString().slice(0, 10),
      profilePath: r.politician_id ? `/insider/person/${r.politician_id}` : undefined,
    };
  });

  const dates = [...new Set(trades.map((t) => t.dateKey))].slice(0, 7).map((d) => ({
    id: d,
    label: d.slice(5),
  }));

  return { trades, dates, etClock: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), marketOpen: false };
}

export async function buildInsiderLiveFeed() {
  const rows = await prisma.openInsiderTransaction.findMany({
    include: { company: true, owner: true },
    orderBy: { transactionDate: 'desc' },
    take: 80,
  });

  const trades = rows.map((r) => {
    const ticker = r.company?.ticker || '—';
    const amountUsd = Number(r.valueNumeric || 0);
    const flags = computeInsiderNotableFlags(amountUsd);
    return {
      id: r.id,
      ticker,
      displayName: r.owner?.name || r.company?.name || '',
      title: r.owner?.title || 'Insider',
      showParty: false,
      side: openInsiderSide(r.transactionType),
      flags,
      disclosureBadge: 'Form 4',
      metricLabel: 'outstanding' as const,
      metricValue: ticker,
      filedDisplay: r.transactionDate.toISOString().slice(0, 10),
      priceDisplay: r.lastPrice ? `$${Number(r.lastPrice).toFixed(2)}` : '—',
      totalValueDisplay: `$${amountUsd.toLocaleString()}`,
      dateKey: r.transactionDate.toISOString().slice(0, 10),
      profilePath: r.ownerId
        ? `/insider/person/person-${r.ownerId}`
        : ticker !== '—'
          ? `/insider/company/company-${ticker.toLowerCase()}`
          : undefined,
    };
  });

  const dates = [...new Set(trades.map((t) => t.dateKey))].slice(0, 7).map((d) => ({
    id: d,
    label: d.slice(5),
  }));

  return { trades, dates, etClock: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), marketOpen: false };
}
