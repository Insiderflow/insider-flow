import {
  isOpenInsider10b51,
  isOpenInsiderBuy,
  isOpenInsiderOption,
  isOpenInsiderSell,
  openInsiderMarketSide,
  openInsiderTradeValue,
} from '@/lib/openInsiderTransaction';

export type OpenInsiderActivityRow = {
  transactionType: string;
  valueNumeric: unknown;
  lastPrice?: unknown;
};

export type OpenInsiderActivityStats = {
  totalBuys: number;
  buyTxCount: number;
  totalSells: number;
  sellTxCount: number;
  totalOptions: number;
  optionTxCount: number;
  plan10b5TxCount: number;
  plan10b5Pct: number;
  avgBuy: number;
  avgSell: number;
  buyRangeMin: number | null;
  buyRangeMax: number | null;
  sellRangeMin: number | null;
  sellRangeMax: number | null;
};

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function aggregateOpenInsiderActivity(
  rows: OpenInsiderActivityRow[],
): OpenInsiderActivityStats {
  let totalBuys = 0;
  let buyTxCount = 0;
  let totalSells = 0;
  let sellTxCount = 0;
  let totalOptions = 0;
  let optionTxCount = 0;
  let plan10b5TxCount = 0;
  const buyPrices: number[] = [];
  const sellPrices: number[] = [];

  for (const row of rows) {
    const amt = openInsiderTradeValue(row.valueNumeric);
    const price = Number(row.lastPrice || 0);

    if (isOpenInsider10b51(row.transactionType)) plan10b5TxCount += 1;

    if (isOpenInsiderBuy(row.transactionType)) {
      buyTxCount += 1;
      totalBuys += amt;
      if (price > 0) buyPrices.push(price);
      continue;
    }
    if (isOpenInsiderSell(row.transactionType)) {
      sellTxCount += 1;
      totalSells += amt;
      if (price > 0) sellPrices.push(price);
      continue;
    }
    if (isOpenInsiderOption(row.transactionType)) {
      optionTxCount += 1;
      totalOptions += amt;
    }
  }

  return {
    totalBuys,
    buyTxCount,
    totalSells,
    sellTxCount,
    totalOptions,
    optionTxCount,
    plan10b5TxCount,
    plan10b5Pct: pct(plan10b5TxCount, sellTxCount),
    avgBuy: buyPrices.length
      ? buyPrices.reduce((a, b) => a + b, 0) / buyPrices.length
      : 0,
    avgSell: sellPrices.length
      ? sellPrices.reduce((a, b) => a + b, 0) / sellPrices.length
      : 0,
    buyRangeMin: buyPrices.length ? Math.min(...buyPrices) : null,
    buyRangeMax: buyPrices.length ? Math.max(...buyPrices) : null,
    sellRangeMin: sellPrices.length ? Math.min(...sellPrices) : null,
    sellRangeMax: sellPrices.length ? Math.max(...sellPrices) : null,
  };
}

export function openInsiderTradeTypeBreakdown(rows: OpenInsiderActivityRow[]): {
  buy: number;
  sell: number;
  option: number;
  plan10b5: number;
} {
  const total = rows.length;
  if (total === 0) return { buy: 0, sell: 0, option: 0, plan10b5: 0 };

  let buy = 0;
  let sell = 0;
  let option = 0;
  let plan10b5 = 0;
  for (const row of rows) {
    if (isOpenInsider10b51(row.transactionType)) plan10b5 += 1;
    else if (isOpenInsiderBuy(row.transactionType)) buy += 1;
    else if (isOpenInsiderSell(row.transactionType)) sell += 1;
    else if (isOpenInsiderOption(row.transactionType)) option += 1;
  }
  return {
    buy: Math.round((buy / total) * 100),
    sell: Math.round((sell / total) * 100),
    option: Math.round((option / total) * 100),
    plan10b5: Math.round((plan10b5 / total) * 100),
  };
}

export { openInsiderMarketSide };
