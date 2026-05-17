import type { PoliticianChartPoint } from '@/data/insiderEntities';
import type { Party, TradeSide } from '@/data/mockData';

export interface IssuerProfileStats {
  trades: number;
  politicians: number;
  totalVolume: number;
  maxTrade: number;
  lastTraded: string | null;
}

export interface IssuerPoliticianRow {
  id: string;
  name: string;
  party: Party;
  trades: number;
  totalVolume: number;
}

export interface IssuerTradeRow {
  id: string;
  politicianId: string;
  politicianName: string;
  party: Party;
  side: TradeSide;
  amount: number;
  tradeDate: string;
  filedAt: string;
}

export interface IssuerProfile {
  id: string;
  name: string;
  ticker: string | null;
  sector: string | null;
  sectorKey: string;
  country: string | null;
  stats: IssuerProfileStats;
  chartPoints: PoliticianChartPoint[];
  topPoliticians: IssuerPoliticianRow[];
  recentTrades: IssuerTradeRow[];
}

export function issuerProfilePath(issuerId: string): string {
  return `/issuer/${issuerId}`;
}
