import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import {
  isOpenInsiderBuy,
  isOpenInsiderSell,
} from '@/lib/openInsiderTransaction';
import type { MobilePeriod } from '@/lib/mobile/dashboardBuilder';
import {
  etCalendarYmd,
  etDayUtcRange,
  politicianPublishedWhere,
} from '@/lib/mobile/tradeDateSanity';

const BRIEF_LOOKBACK_DAYS = 14;
const XAI_TRADE_LINE_CAP = 120;

type BriefMode = 'politician' | 'insider';

export type BriefLocale = 'zh-Hant' | 'zh-Hans' | 'en';

export type DailyTradeBrief = {
  headline: string;
  narrative: string;
  sentiment: 'bullish' | 'bearish' | 'mixed';
  focusDateEt: string;
  generatedAt: string;
  source: 'xai' | 'rules';
  tradeCount: number;
};

const CACHE_DIR = path.join(process.cwd(), '.cache');
const LOG_FILE = path.join(process.cwd(), '.artifacts', 'daily-brief-log.json');

function disclosureDate(row: { published_at: Date | null; traded_at: Date }): Date {
  return row.published_at ?? row.traded_at;
}

function tradeAmount(sizeMin: unknown, sizeMax: unknown): number {
  const max = Number(sizeMax || 0);
  const min = Number(sizeMin || 0);
  if (max > 0) return max;
  if (min > 0) return min;
  return 0;
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatRange(min: unknown, max: unknown): string {
  const lo = Number(min || 0);
  const hi = Number(max || 0);
  if (lo > 0 && hi > 0) return `${formatUsd(lo)}–${formatUsd(hi)}`;
  if (hi > 0) return formatUsd(hi);
  if (lo > 0) return formatUsd(lo);
  return '';
}

function isSellType(type: string) {
  return type.toLowerCase().includes('sell');
}

function sentimentFromCounts(buys: number, sells: number): DailyTradeBrief['sentiment'] {
  if (buys > sells * 1.2) return 'bullish';
  if (sells > buys * 1.2) return 'bearish';
  return 'mixed';
}

type PoliticianBriefTrade = {
  politician: string;
  party: string;
  ticker: string;
  company: string;
  side: 'buy' | 'sell';
  amount: number;
  amountLabel: string;
  tradeDate: string;
};

type InsiderBriefTrade = {
  insider: string;
  title: string;
  ticker: string;
  company: string;
  side: 'buy' | 'sell';
  amount: number;
  amountLabel: string;
  tradeDate: string;
};

type TickerSideStats = {
  ticker: string;
  buys: number;
  sells: number;
  buyAmt: number;
  sellAmt: number;
};

type DayBriefStats = {
  total: number;
  buys: number;
  sells: number;
  buyNotional: number;
  sellNotional: number;
  withAmount: number;
  uniqueTickers: number;
  uniqueActors: number;
  topBuyTickers: TickerSideStats[];
  topSellTickers: TickerSideStats[];
  groupLines: string[];
  largestLines: string[];
};

type BriefLog = { etDate: string; politician: number; insider: number };

function lookbackSince(): Date {
  const d = new Date();
  d.setDate(d.getDate() - BRIEF_LOOKBACK_DAYS);
  return d;
}

function tickerKey(ticker: string, company: string): string {
  const t = ticker?.trim();
  return t || company?.trim() || '—';
}

function bumpTicker(
  map: Map<string, TickerSideStats>,
  ticker: string,
  side: 'buy' | 'sell',
  amount: number,
) {
  const cur = map.get(ticker) || { ticker, buys: 0, sells: 0, buyAmt: 0, sellAmt: 0 };
  if (side === 'buy') {
    cur.buys += 1;
    cur.buyAmt += amount;
  } else {
    cur.sells += 1;
    cur.sellAmt += amount;
  }
  map.set(ticker, cur);
}

function topTickersBySide(
  map: Map<string, TickerSideStats>,
  side: 'buy' | 'sell',
  limit: number,
): TickerSideStats[] {
  return [...map.values()]
    .filter((t) => (side === 'buy' ? t.buys : t.sells) > 0)
    .sort((a, b) => {
      const ac = side === 'buy' ? a.buys : a.sells;
      const bc = side === 'buy' ? b.buys : b.sells;
      if (bc !== ac) return bc - ac;
      const aa = side === 'buy' ? a.buyAmt : a.sellAmt;
      const ba = side === 'buy' ? b.buyAmt : b.sellAmt;
      return ba - aa;
    })
    .slice(0, limit);
}

function formatTickerCluster(
  locale: BriefLocale,
  items: TickerSideStats[],
  side: 'buy' | 'sell',
): string {
  if (items.length === 0) return '';
  return items
    .map((t) => {
      const count = side === 'buy' ? t.buys : t.sells;
      const amt = side === 'buy' ? t.buyAmt : t.sellAmt;
      const amtPart = amt > 0 ? ` ${formatUsd(amt)}` : '';
      if (locale === 'zh-Hans') return `${t.ticker}（${count} 笔${amtPart}）`;
      if (locale === 'zh-Hant') return `${t.ticker}（${count} 筆${amtPart}）`;
      return `${t.ticker} (${count}${amtPart ? `, ${amtPart.trim()}` : ''})`;
    })
    .join(locale === 'en' ? ', ' : '、');
}

function computePoliticianDayStats(trades: PoliticianBriefTrade[]): DayBriefStats {
  const byTicker = new Map<string, TickerSideStats>();
  const byParty = new Map<string, { buy: number; sell: number }>();
  const actors = new Set<string>();
  let buyNotional = 0;
  let sellNotional = 0;
  let withAmount = 0;

  for (const t of trades) {
    const tk = tickerKey(t.ticker, t.company);
    actors.add(t.politician);
    bumpTicker(byTicker, tk, t.side, t.amount);
    if (t.amount > 0) {
      withAmount += 1;
      if (t.side === 'buy') buyNotional += t.amount;
      else sellNotional += t.amount;
    }
    const party = t.party?.trim() || 'Other';
    const pg = byParty.get(party) || { buy: 0, sell: 0 };
    if (t.side === 'buy') pg.buy += 1;
    else pg.sell += 1;
    byParty.set(party, pg);
  }

  const buys = trades.filter((t) => t.side === 'buy').length;
  const sells = trades.filter((t) => t.side === 'sell').length;

  const groupLines = [...byParty.entries()]
    .sort((a, b) => b[1].buy + b[1].sell - (a[1].buy + a[1].sell))
    .map(([party, v]) => `${party} buy ${v.buy} sell ${v.sell}`);

  const largestLines = [...trades]
    .filter((t) => t.amount > 0 || t.amountLabel)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map(
      (t) =>
        `${t.politician} ${t.side} ${t.ticker || t.company} ${t.amountLabel || formatUsd(t.amount)}`,
    );

  return {
    total: trades.length,
    buys,
    sells,
    buyNotional,
    sellNotional,
    withAmount,
    uniqueTickers: byTicker.size,
    uniqueActors: actors.size,
    topBuyTickers: topTickersBySide(byTicker, 'buy', 5),
    topSellTickers: topTickersBySide(byTicker, 'sell', 5),
    groupLines,
    largestLines,
  };
}

function computeInsiderDayStats(trades: InsiderBriefTrade[]): DayBriefStats {
  const byTicker = new Map<string, TickerSideStats>();
  const byRole = new Map<string, { buy: number; sell: number }>();
  const actors = new Set<string>();
  let buyNotional = 0;
  let sellNotional = 0;
  let withAmount = 0;

  for (const t of trades) {
    const tk = tickerKey(t.ticker, t.company);
    actors.add(t.insider);
    bumpTicker(byTicker, tk, t.side, t.amount);
    if (t.amount > 0) {
      withAmount += 1;
      if (t.side === 'buy') buyNotional += t.amount;
      else sellNotional += t.amount;
    }
    const role = t.title?.trim() || 'Insider';
    const rg = byRole.get(role) || { buy: 0, sell: 0 };
    if (t.side === 'buy') rg.buy += 1;
    else rg.sell += 1;
    byRole.set(role, rg);
  }

  const buys = trades.filter((t) => t.side === 'buy').length;
  const sells = trades.filter((t) => t.side === 'sell').length;

  const groupLines = [...byRole.entries()]
    .sort((a, b) => b[1].buy + b[1].sell - (a[1].buy + a[1].sell))
    .slice(0, 6)
    .map(([role, v]) => `${role} buy ${v.buy} sell ${v.sell}`);

  const largestLines = [...trades]
    .filter((t) => t.amount > 0 || t.amountLabel)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map(
      (t) =>
        `${t.insider} (${t.title}) ${t.side} ${t.ticker || t.company} ${t.amountLabel || formatUsd(t.amount)}`,
    );

  return {
    total: trades.length,
    buys,
    sells,
    buyNotional,
    sellNotional,
    withAmount,
    uniqueTickers: byTicker.size,
    uniqueActors: actors.size,
    topBuyTickers: topTickersBySide(byTicker, 'buy', 5),
    topSellTickers: topTickersBySide(byTicker, 'sell', 5),
    groupLines,
    largestLines,
  };
}

function notionalPhrase(locale: BriefLocale, stats: DayBriefStats): string {
  const hasBuy = stats.buyNotional > 0;
  const hasSell = stats.sellNotional > 0;
  if (!hasBuy && !hasSell) {
    if (locale === 'zh-Hans') return '多数申报未披露金额区间';
    if (locale === 'zh-Hant') return '多數申報未披露金額區間';
    return 'most filings omit dollar ranges';
  }
  if (locale === 'zh-Hans') {
    return `估计买入规模约 ${hasBuy ? formatUsd(stats.buyNotional) : '—'}、卖出约 ${hasSell ? formatUsd(stats.sellNotional) : '—'}`;
  }
  if (locale === 'zh-Hant') {
    return `估計買入規模約 ${hasBuy ? formatUsd(stats.buyNotional) : '—'}、賣出約 ${hasSell ? formatUsd(stats.sellNotional) : '—'}`;
  }
  return `estimated buy notional ${hasBuy ? formatUsd(stats.buyNotional) : 'n/a'}, sell ${hasSell ? formatUsd(stats.sellNotional) : 'n/a'}`;
}

function formatPartyLines(locale: BriefLocale, lines: string[]): string {
  if (lines.length === 0) return '';
  const parsed = lines.map((line) => {
    const m = line.match(/^(.+) buy (\d+) sell (\d+)$/);
    if (!m) return line;
    const [, party, buy, sell] = m;
    if (locale === 'zh-Hans') return `${party} 买 ${buy}／卖 ${sell}`;
    if (locale === 'zh-Hant') return `${party} 買 ${buy}／賣 ${sell}`;
    return `${party}: ${buy} buys, ${sell} sells`;
  });
  if (locale === 'zh-Hans') return `党派分布：${parsed.join('；')}`;
  if (locale === 'zh-Hant') return `黨派分布：${parsed.join('；')}`;
  return `By party: ${parsed.join('; ')}`;
}

function formatRoleLines(locale: BriefLocale, lines: string[]): string {
  if (lines.length === 0) return '';
  const parsed = lines.map((line) => {
    const m = line.match(/^(.+) buy (\d+) sell (\d+)$/);
    if (!m) return line;
    const [, role, buy, sell] = m;
    if (locale === 'zh-Hans') return `${role} 买 ${buy}／卖 ${sell}`;
    if (locale === 'zh-Hant') return `${role} 買 ${buy}／賣 ${sell}`;
    return `${role}: ${buy} buys, ${sell} sells`;
  });
  if (locale === 'zh-Hans') return `职务分布：${parsed.join('；')}`;
  if (locale === 'zh-Hant') return `職務分布：${parsed.join('；')}`;
  return `By role: ${parsed.join('; ')}`;
}

async function readBriefLog(): Promise<BriefLog | null> {
  try {
    const raw = await fs.readFile(LOG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<BriefLog> & { count?: number };
    if (!parsed.etDate) return null;
    if (typeof parsed.politician === 'number' && typeof parsed.insider === 'number') {
      return parsed as BriefLog;
    }
    if (typeof parsed.count === 'number') {
      return { etDate: parsed.etDate, politician: parsed.count, insider: 0 };
    }
  } catch {
    /* no log */
  }
  return null;
}

async function bumpBriefLog(etDate: string, mode: BriefMode): Promise<void> {
  const cur = await readBriefLog();
  const base: BriefLog =
    cur?.etDate === etDate ? cur : { etDate, politician: 0, insider: 0 };
  if (mode === 'politician') base.politician += 1;
  else base.insider += 1;
  await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
  await fs.writeFile(
    LOG_FILE,
    JSON.stringify({ ...base, at: new Date().toISOString() }),
    'utf8',
  );
}

function briefLogCount(log: BriefLog | null, etDate: string, mode: BriefMode): number {
  if (!log || log.etDate !== etDate) return 0;
  return mode === 'politician' ? log.politician : log.insider;
}

async function readCachedBrief(
  mode: BriefMode,
  etDate: string,
): Promise<DailyTradeBrief | null> {
  try {
    const raw = await fs.readFile(
      path.join(CACHE_DIR, `daily-brief-${mode}-${etDate}.json`),
      'utf8',
    );
    return JSON.parse(raw) as DailyTradeBrief;
  } catch {
    return null;
  }
}

async function writeCachedBrief(
  mode: BriefMode,
  etDate: string,
  brief: DailyTradeBrief,
): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(
    path.join(CACHE_DIR, `daily-brief-${mode}-${etDate}.json`),
    JSON.stringify(brief, null, 2),
    'utf8',
  );
}

function formatInsiderValue(valueNumeric: unknown, value: string): string {
  const n = Number(valueNumeric || 0);
  if (n > 0) return formatUsd(n);
  const parsed = Number(String(value).replace(/[^0-9.-]/g, '') || 0);
  if (parsed > 0) return formatUsd(parsed);
  return '';
}

async function loadPoliticianTradesForBrief(focusDateEt: string) {
  const { gte, lt } = etDayUtcRange(focusDateEt);

  const rows = await prisma.trade.findMany({
    where: {
      AND: [
        politicianPublishedWhere(lookbackSince()),
        {
          OR: [
            { published_at: { gte, lt } },
            { published_at: null, traded_at: { gte, lt } },
          ],
        },
      ],
    },
    include: { Politician: true, Issuer: true },
    orderBy: { published_at: 'desc' },
  });

  const todayRows = rows.filter((r) => etCalendarYmd(disclosureDate(r)) === focusDateEt);

  const briefTrades: PoliticianBriefTrade[] = todayRows.map((r) => {
    const amt = tradeAmount(r.size_min, r.size_max);
    return {
      politician: r.Politician?.name || 'Unknown',
      party: r.Politician?.party || '',
      ticker: r.Issuer?.ticker || '',
      company: r.Issuer?.name || '',
      side: isSellType(r.type) ? 'sell' : 'buy',
      amount: amt,
      amountLabel: formatRange(r.size_min, r.size_max),
      tradeDate: r.traded_at.toISOString().slice(0, 10),
    };
  });

  briefTrades.sort((a, b) => b.amount - a.amount);

  const stats = computePoliticianDayStats(briefTrades);
  return {
    briefTrades,
    buys: stats.buys,
    sells: stats.sells,
    total: stats.total,
    stats,
  };
}

async function loadInsiderTradesForBrief(focusDateEt: string) {
  const { gte, lt } = etDayUtcRange(focusDateEt);

  const rows = await prisma.openInsiderTransaction.findMany({
    where: { transactionDate: { gte, lt } },
    include: { company: true, owner: true },
    orderBy: { transactionDate: 'desc' },
  });

  const todayRows = rows.filter((r) => etCalendarYmd(r.transactionDate) === focusDateEt);

  const briefTrades: InsiderBriefTrade[] = todayRows
    .filter(
      (r) =>
        isOpenInsiderBuy(r.transactionType) || isOpenInsiderSell(r.transactionType),
    )
    .map((r) => {
      const amt = Number(r.valueNumeric || 0);
      return {
        insider: r.owner?.name || 'Unknown',
        title: r.owner?.title || 'Insider',
        ticker: r.company?.ticker || '',
        company: r.company?.name || '',
        side: isOpenInsiderSell(r.transactionType) ? 'sell' : 'buy',
        amount: amt,
        amountLabel: formatInsiderValue(r.valueNumeric, r.value),
        tradeDate: r.tradeDate.toISOString().slice(0, 10),
      };
    });

  briefTrades.sort((a, b) => b.amount - a.amount);

  const stats = computeInsiderDayStats(briefTrades);
  return {
    briefTrades,
    buys: stats.buys,
    sells: stats.sells,
    total: stats.total,
    stats,
  };
}

function rulesPoliticianNarrative(
  locale: BriefLocale,
  focusDateEt: string,
  trades: PoliticianBriefTrade[],
  stats: DayBriefStats,
): { headline: string; narrative: string } {
  const { buys, sells } = stats;
  const dateLabel = focusDateEt.replace(/-/g, '/');

  if (trades.length === 0) {
    if (locale === 'zh-Hans') {
      return {
        headline: `${dateLabel} 国会披露`,
        narrative: `截至美东时间，${dateLabel} 尚无新的 STOCK 申报入库。通常会在披露日后几小时至数天内陆续出现，请稍后再查看。`,
      };
    }
    if (locale === 'zh-Hant') {
      return {
        headline: `${dateLabel} 國會披露`,
        narrative: `截至美東時間，${dateLabel} 尚無新的 STOCK 申報入庫。通常會在披露日後幾小時至數天內陸續出現，請稍後再查看。`,
      };
    }
    return {
      headline: `Congressional disclosures · ${focusDateEt}`,
      narrative: `No new STOCK Act filings have been recorded for ${focusDateEt} (US Eastern) yet. Disclosures often appear hours or days after the trade date.`,
    };
  }

  const buyCluster = formatTickerCluster(locale, stats.topBuyTickers, 'buy');
  const sellCluster = formatTickerCluster(locale, stats.topSellTickers, 'sell');
  const party = formatPartyLines(locale, stats.groupLines);
  const largest =
    stats.largestLines.length > 0
      ? locale === 'zh-Hans'
        ? `单笔规模前列：${stats.largestLines.join('；')}`
        : locale === 'zh-Hant'
          ? `單筆規模前列：${stats.largestLines.join('；')}`
          : `Largest disclosed: ${stats.largestLines.join('; ')}`
      : '';

  if (locale === 'zh-Hans') {
    return {
      headline: `${dateLabel} · ${stats.total} 笔申报`,
      narrative: [
        `美东 ${dateLabel} 全日共 ${stats.total} 笔议员 STOCK 申报：买入 ${buys} 笔、卖出 ${sells} 笔，${notionalPhrase(locale, stats)}，涉及 ${stats.uniqueTickers} 只股票、${stats.uniqueActors} 位议员。`,
        buyCluster ? `买入集中在 ${buyCluster}。` : '',
        sellCluster ? `卖出集中在 ${sellCluster}。` : '',
        party,
        largest,
      ]
        .filter(Boolean)
        .join(''),
    };
  }
  if (locale === 'zh-Hant') {
    return {
      headline: `${dateLabel} · ${stats.total} 筆申報`,
      narrative: [
        `美東 ${dateLabel} 全日共 ${stats.total} 筆議員 STOCK 申報：買入 ${buys} 筆、賣出 ${sells} 筆，${notionalPhrase(locale, stats)}，涉及 ${stats.uniqueTickers} 檔標的、${stats.uniqueActors} 位議員。`,
        buyCluster ? `買入集中在 ${buyCluster}。` : '',
        sellCluster ? `賣出集中在 ${sellCluster}。` : '',
        party,
        largest,
      ]
        .filter(Boolean)
        .join(''),
    };
  }
  return {
    headline: `${focusDateEt} · ${stats.total} filings`,
    narrative: [
      `On ${focusDateEt} (ET), all ${stats.total} congressional STOCK disclosures (${buys} buys, ${sells} sells); ${notionalPhrase(locale, stats)}; ${stats.uniqueTickers} tickers, ${stats.uniqueActors} members.`,
      buyCluster ? `Buy concentration: ${buyCluster}.` : '',
      sellCluster ? `Sell concentration: ${sellCluster}.` : '',
      party,
      largest,
    ]
      .filter(Boolean)
      .join(' '),
  };
}

function rulesInsiderNarrative(
  locale: BriefLocale,
  focusDateEt: string,
  trades: InsiderBriefTrade[],
  stats: DayBriefStats,
): { headline: string; narrative: string } {
  const { buys, sells } = stats;
  const dateLabel = focusDateEt.replace(/-/g, '/');

  if (trades.length === 0) {
    if (locale === 'zh-Hans') {
      return {
        headline: `${dateLabel} Form 4`,
        narrative: `截至美东时间，${dateLabel} 尚无新的 Form 4 内部人申报入库。申报通常在交易后 2 个工作日内陆续出现，请稍后再查看。`,
      };
    }
    if (locale === 'zh-Hant') {
      return {
        headline: `${dateLabel} Form 4`,
        narrative: `截至美東時間，${dateLabel} 尚無新的 Form 4 內部人申報入庫。申報通常在交易後 2 個工作日內陸續出現，請稍後再查看。`,
      };
    }
    return {
      headline: `Form 4 filings · ${focusDateEt}`,
      narrative: `No new SEC Form 4 insider filings have been recorded for ${focusDateEt} (US Eastern) yet. Filings typically land within two business days after the trade.`,
    };
  }

  const buyCluster = formatTickerCluster(locale, stats.topBuyTickers, 'buy');
  const sellCluster = formatTickerCluster(locale, stats.topSellTickers, 'sell');
  const roles = formatRoleLines(locale, stats.groupLines);
  const largest =
    stats.largestLines.length > 0
      ? locale === 'zh-Hans'
        ? `单笔规模前列：${stats.largestLines.join('；')}`
        : locale === 'zh-Hant'
          ? `單筆規模前列：${stats.largestLines.join('；')}`
          : `Largest disclosed: ${stats.largestLines.join('; ')}`
      : '';

  if (locale === 'zh-Hans') {
    return {
      headline: `${dateLabel} · ${stats.total} 笔 Form 4`,
      narrative: [
        `美东 ${dateLabel} 全日共 ${stats.total} 笔 Form 4 内部人申报：买入 ${buys} 笔、卖出 ${sells} 笔，${notionalPhrase(locale, stats)}，涉及 ${stats.uniqueTickers} 只股票、${stats.uniqueActors} 位内部人。`,
        buyCluster ? `买入集中在 ${buyCluster}。` : '',
        sellCluster ? `卖出集中在 ${sellCluster}。` : '',
        roles,
        largest,
      ]
        .filter(Boolean)
        .join(''),
    };
  }
  if (locale === 'zh-Hant') {
    return {
      headline: `${dateLabel} · ${stats.total} 筆 Form 4`,
      narrative: [
        `美東 ${dateLabel} 全日共 ${stats.total} 筆 Form 4 內部人申報：買入 ${buys} 筆、賣出 ${sells} 筆，${notionalPhrase(locale, stats)}，涉及 ${stats.uniqueTickers} 檔標的、${stats.uniqueActors} 位內部人。`,
        buyCluster ? `買入集中在 ${buyCluster}。` : '',
        sellCluster ? `賣出集中在 ${sellCluster}。` : '',
        roles,
        largest,
      ]
        .filter(Boolean)
        .join(''),
    };
  }
  return {
    headline: `${focusDateEt} · ${stats.total} Form 4s`,
    narrative: [
      `On ${focusDateEt} (ET), all ${stats.total} Form 4 insider filings (${buys} buys, ${sells} sells); ${notionalPhrase(locale, stats)}; ${stats.uniqueTickers} tickers, ${stats.uniqueActors} insiders.`,
      buyCluster ? `Buy concentration: ${buyCluster}.` : '',
      sellCluster ? `Sell concentration: ${sellCluster}.` : '',
      roles,
      largest,
    ]
      .filter(Boolean)
      .join(' '),
  };
}

function aggregateBlock(stats: DayBriefStats): string {
  return [
    `total_filings: ${stats.total}`,
    `buys: ${stats.buys}, sells: ${stats.sells}`,
    `buy_notional_est: ${stats.buyNotional}, sell_notional_est: ${stats.sellNotional}`,
    `filings_with_amount: ${stats.withAmount}`,
    `unique_tickers: ${stats.uniqueTickers}, unique_actors: ${stats.uniqueActors}`,
    `top_buy_tickers: ${stats.topBuyTickers.map((t) => `${t.ticker}(${t.buys})`).join(', ')}`,
    `top_sell_tickers: ${stats.topSellTickers.map((t) => `${t.ticker}(${t.sells})`).join(', ')}`,
    `groups: ${stats.groupLines.join('; ')}`,
    `largest: ${stats.largestLines.join('; ')}`,
  ].join('\n');
}

async function xaiPoliticianNarrative(
  locale: BriefLocale,
  focusDateEt: string,
  trades: PoliticianBriefTrade[],
  stats: DayBriefStats,
): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.XAI_MODEL?.trim() || 'grok-2-latest';
  const lang =
    locale === 'zh-Hans' ? 'Simplified Chinese' : locale === 'zh-Hant' ? 'Traditional Chinese' : 'English';

  const tradeLines = trades.slice(0, XAI_TRADE_LINE_CAP).map(
    (t, i) =>
      `${i + 1}. ${t.politician} (${t.party}) ${t.side} ${t.ticker} ${t.company} amount ${t.amountLabel || 'unknown'} trade_date ${t.tradeDate}`,
  );
  const overflow =
    trades.length > XAI_TRADE_LINE_CAP
      ? `\n(... ${trades.length - XAI_TRADE_LINE_CAP} more filings; use AGGREGATE for full-day totals)`
      : '';

  const system = `You write daily briefings on U.S. congressional STOCK Act disclosures for a mobile finance app. Write in ${lang}. No bullet points. One cohesive paragraph (4-6 sentences) summarizing the ENTIRE disclosure day — totals, buy/sell balance, ticker themes, party split, and only then notable names. Use AGGREGATE as the source of truth for counts. Do not invent trades.`;

  const user = `Disclosure date (US Eastern): ${focusDateEt}

AGGREGATE (all ${stats.total} filings this day):
${aggregateBlock(stats)}

COMPLETE FILING LIST (${trades.length} rows):
${tradeLines.join('\n')}${overflow}

Write a full-day summary paragraph for investors.`;

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 800,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      console.warn('xAI daily brief failed', res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (e) {
    console.warn('xAI daily brief error', e);
    return null;
  }
}

async function xaiInsiderNarrative(
  locale: BriefLocale,
  focusDateEt: string,
  trades: InsiderBriefTrade[],
  stats: DayBriefStats,
): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.XAI_MODEL?.trim() || 'grok-2-latest';
  const lang =
    locale === 'zh-Hans' ? 'Simplified Chinese' : locale === 'zh-Hant' ? 'Traditional Chinese' : 'English';

  const tradeLines = trades.slice(0, XAI_TRADE_LINE_CAP).map(
    (t, i) =>
      `${i + 1}. ${t.insider} (${t.title}) ${t.side} ${t.ticker} ${t.company} value ${t.amountLabel || 'unknown'} trade_date ${t.tradeDate}`,
  );
  const overflow =
    trades.length > XAI_TRADE_LINE_CAP
      ? `\n(... ${trades.length - XAI_TRADE_LINE_CAP} more filings; use AGGREGATE for full-day totals)`
      : '';

  const system = `You write daily briefings on U.S. SEC Form 4 insider transactions for a mobile finance app. Write in ${lang}. No bullet points. One cohesive paragraph (4-6 sentences) summarizing the ENTIRE filing day — totals, buy/sell balance, ticker themes, role mix (CEO/CFO/Director), then notable names. Use AGGREGATE as the source of truth for counts. Do not invent trades.`;

  const user = `Filing date (US Eastern): ${focusDateEt}

AGGREGATE (all ${stats.total} filings this day):
${aggregateBlock(stats)}

COMPLETE FILING LIST (${trades.length} rows):
${tradeLines.join('\n')}${overflow}

Write a full-day summary paragraph for investors.`;

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 800,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      console.warn('xAI insider daily brief failed', res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (e) {
    console.warn('xAI insider daily brief error', e);
    return null;
  }
}

type BriefLoadResult<T> = {
  briefTrades: T[];
  buys: number;
  sells: number;
  total: number;
  stats: DayBriefStats;
};

async function buildDailyTradeBrief<T extends PoliticianBriefTrade | InsiderBriefTrade>(
  mode: BriefMode,
  locale: BriefLocale,
  load: (focusDateEt: string) => Promise<BriefLoadResult<T>>,
  rules: (
    locale: BriefLocale,
    focusDateEt: string,
    trades: T[],
    stats: DayBriefStats,
  ) => { headline: string; narrative: string },
  xai: (
    locale: BriefLocale,
    focusDateEt: string,
    trades: T[],
    stats: DayBriefStats,
  ) => Promise<string | null>,
): Promise<DailyTradeBrief> {
  const focusDateEt = etCalendarYmd();
  const maxCalls = Math.max(1, Number(process.env.DAILY_BRIEF_MAX_CALLS_PER_DAY || 2));

  const { briefTrades, buys, sells, total, stats } = await load(focusDateEt);

  const cached = await readCachedBrief(mode, focusDateEt);
  if (cached && cached.tradeCount === total) return cached;

  const log = await readBriefLog();
  const callsUsed = briefLogCount(log, focusDateEt, mode);
  const canCallLlm = callsUsed < maxCalls;
  const rulesOut = rules(locale, focusDateEt, briefTrades, stats);

  let narrative = rulesOut.narrative;
  let source: DailyTradeBrief['source'] = 'rules';

  if (canCallLlm && total > 0) {
    const llm = await xai(locale, focusDateEt, briefTrades, stats);
    if (llm) {
      narrative = llm;
      source = 'xai';
      await bumpBriefLog(focusDateEt, mode);
    }
  }

  const brief: DailyTradeBrief = {
    headline: rulesOut.headline,
    narrative,
    sentiment: sentimentFromCounts(buys, sells),
    focusDateEt,
    generatedAt: new Date().toISOString(),
    source,
    tradeCount: total,
  };

  await writeCachedBrief(mode, focusDateEt, brief);
  return brief;
}

export async function getPoliticianDailyTradeBrief(
  locale: BriefLocale,
  _period: MobilePeriod,
): Promise<DailyTradeBrief> {
  return buildDailyTradeBrief(
    'politician',
    locale,
    loadPoliticianTradesForBrief,
    rulesPoliticianNarrative,
    xaiPoliticianNarrative,
  );
}

export async function getInsiderDailyTradeBrief(
  locale: BriefLocale,
  _period: MobilePeriod,
): Promise<DailyTradeBrief> {
  return buildDailyTradeBrief(
    'insider',
    locale,
    loadInsiderTradesForBrief,
    rulesInsiderNarrative,
    xaiInsiderNarrative,
  );
}
