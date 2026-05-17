import { prisma } from '@/lib/prisma';

export async function getInstitutionalHoldingsOverview() {
  const [totalRows, latestReport, investorCount, symbolCount] = await Promise.all([
    prisma.institutionalHoldingSnapshot.count(),
    prisma.institutionalHoldingSnapshot.aggregate({ _max: { reportDate: true } }),
    prisma.institutionalHoldingSnapshot.groupBy({
      by: ['investorName'],
      _count: true,
    }),
    prisma.institutionalHoldingSnapshot.groupBy({
      by: ['symbol'],
      _count: true,
    }),
  ]);

  const latest = latestReport._max.reportDate;
  if (!latest || totalRows === 0) {
    return {
      totalRows: 0,
      latestReportDate: null,
      investorCount: 0,
      symbolCount: 0,
      topInvestors: [] as TopInvestorRow[],
      topSymbols: [] as TopSymbolRow[],
    };
  }

  const [topInvestors, topSymbols] = await Promise.all([
    prisma.institutionalHoldingSnapshot.groupBy({
      by: ['investorName', 'investorCik'],
      where: { reportDate: latest },
      _sum: { valueUsd: true },
      _count: { symbol: true },
      orderBy: { _sum: { valueUsd: 'desc' } },
      take: 25,
    }),
    prisma.institutionalHoldingSnapshot.groupBy({
      by: ['symbol'],
      where: { reportDate: latest },
      _sum: { valueUsd: true },
      _count: { investorName: true },
      orderBy: { _sum: { valueUsd: 'desc' } },
      take: 20,
    }),
  ]);

  return {
    totalRows,
    latestReportDate: latest.toISOString().slice(0, 10),
    investorCount: investorCount.length,
    symbolCount: symbolCount.length,
    topInvestors: topInvestors.map((r) => ({
      name: r.investorName,
      cik: r.investorCik,
      positions: r._count.symbol,
      valueUsd: Number(r._sum.valueUsd ?? 0),
    })),
    topSymbols: topSymbols.map((r) => ({
      symbol: r.symbol,
      holders: r._count.investorName,
      valueUsd: Number(r._sum.valueUsd ?? 0),
    })),
  };
}

export type TopInvestorRow = {
  name: string;
  cik: string | null;
  positions: number;
  valueUsd: number;
};

export type TopSymbolRow = {
  symbol: string;
  holders: number;
  valueUsd: number;
};

export function formatUsdCompact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
