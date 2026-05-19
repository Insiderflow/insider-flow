import fs from 'fs/promises';
import path from 'path';
import type { BriefLocale } from '@/lib/mobile/dailyTradeBrief';
import type { MobilePeriod } from '@/lib/mobile/dashboardBuilder';
import type {
  MobileSignalItem,
  SignalFeed,
} from '@/lib/mobile/signalsBuilder';

export type SignalsAiSummary = {
  headline: string;
  narrative: string;
  bullets: string[];
  sentiment: 'bullish' | 'bearish' | 'mixed';
};

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_TTL_MS = 30 * 60 * 1000;
const XAI_SIGNAL_CAP = 25;

const PERIOD_LABEL: Record<BriefLocale, Record<MobilePeriod, string>> = {
  'zh-Hant': { '1D': '1日', '7D': '7日', '30D': '30日', '90D': '90日' },
  'zh-Hans': { '1D': '1日', '7D': '7日', '30D': '30日', '90D': '90日' },
  en: { '1D': '1D', '7D': '7D', '30D': '30D', '90D': '90D' },
};

const FEED_LABEL: Record<BriefLocale, Record<SignalFeed, string>> = {
  'zh-Hant': { all: '全部', politician: '國會', corporate: '企業' },
  'zh-Hans': { all: '全部', politician: '国会', corporate: '企业' },
  en: { all: 'All', politician: 'Congress', corporate: 'Corporate' },
};

const FLAG_LABEL: Record<BriefLocale, Record<string, string>> = {
  'zh-Hant': {
    notable_size: '大額',
    committee_sector: '委員會相關',
    congress_cluster: '國會集群',
    insider_cluster: '內部人集群',
  },
  'zh-Hans': {
    notable_size: '大额',
    committee_sector: '委员会相关',
    congress_cluster: '国会集群',
    insider_cluster: '内部人集群',
  },
  en: {
    notable_size: 'Notable size',
    committee_sector: 'Committee sector',
    congress_cluster: 'Congress cluster',
    insider_cluster: 'Insider cluster',
  },
};

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function sentimentFromSignals(
  signals: MobileSignalItem[],
): SignalsAiSummary['sentiment'] {
  let buys = 0;
  let sells = 0;
  for (const s of signals) {
    if (s.side === 'buy') buys += 1;
    else if (s.side === 'sell' || s.side === 'proposed_sale') sells += 1;
  }
  if (buys > sells * 1.2) return 'bullish';
  if (sells > buys * 1.2) return 'bearish';
  return 'mixed';
}

function flagLabels(locale: BriefLocale, flags: string[]): string {
  const map = FLAG_LABEL[locale] || FLAG_LABEL['zh-Hant'];
  return flags.map((f) => map[f] || f).join(locale === 'en' ? ', ' : '、');
}

function signalFingerprint(signals: MobileSignalItem[]): string {
  return signals
    .slice(0, 10)
    .map((s) => s.id)
    .join('|');
}

function rulesHeadline(
  locale: BriefLocale,
  period: MobilePeriod,
  feed: SignalFeed,
  count: number,
): string {
  const p = PERIOD_LABEL[locale]?.[period] ?? period;
  const f = FEED_LABEL[locale]?.[feed] ?? feed;
  if (locale === 'en') {
    return count === 0
      ? `No flagged signals · ${p} · ${f}`
      : `${count} flagged signals · ${p} · ${f}`;
  }
  return count === 0
    ? `過去${p} · ${f} · 尚無規則標記訊號`
    : `過去${p} · ${f} · ${count} 則標記訊號`;
}

function rulesBullets(
  locale: BriefLocale,
  signals: MobileSignalItem[],
): string[] {
  const top = signals.slice(0, 4);
  return top.map((s) => {
    const flags = flagLabels(locale, s.flags);
    const side =
      s.side === 'buy'
        ? locale === 'en'
          ? 'buy'
          : '買入'
        : s.side === 'sell'
          ? locale === 'en'
            ? 'sell'
            : '賣出'
          : locale === 'en'
            ? 'proposed sale'
            : '擬出售';
    const who =
      s.feed === 'corporate'
        ? s.politicianName
        : `${s.politicianName}${s.party !== 'I' ? ` (${s.party})` : ''}`;
    if (locale === 'en') {
      return `${who} ${side} ${s.ticker} · ${flags} · ML ${s.mlScore} (${s.mlTier}) · ${formatUsd(s.amountUsd)}`;
    }
    return `${who} ${side} ${s.ticker} · ${flags} · 評分 ${s.mlScore}（${s.mlTier === 'high' ? '高' : s.mlTier === 'medium' ? '中' : '低'}）· ${formatUsd(s.amountUsd)}`;
  });
}

function rulesNarrative(
  locale: BriefLocale,
  period: MobilePeriod,
  feed: SignalFeed,
  signals: MobileSignalItem[],
): string {
  if (signals.length === 0) {
    if (locale === 'en') {
      return `No trades met rule flags (notable size, committee sector, congress/insider cluster) in the ${PERIOD_LABEL.en[period]} window for ${FEED_LABEL.en[feed]}.`;
    }
    if (locale === 'zh-Hans') {
      return `过去${PERIOD_LABEL['zh-Hans'][period]}内，${FEED_LABEL['zh-Hans'][feed]}来源暂无满足规则标记（大额、委员会板块、多人同向等）的交易。`;
    }
    return `過去${PERIOD_LABEL['zh-Hant'][period]}內，${FEED_LABEL['zh-Hant'][feed]}來源暫無滿足規則標記（大額、委員會板塊、多人同向等）的交易。`;
  }

  const buys = signals.filter((s) => s.side === 'buy').length;
  const sells = signals.length - buys;
  const high = signals.filter((s) => s.mlTier === 'high').length;
  const tickers = [...new Set(signals.map((s) => s.ticker))].slice(0, 5);
  const pol = signals.filter((s) => s.feed === 'politician').length;
  const corp = signals.filter((s) => s.feed === 'corporate').length;

  if (locale === 'en') {
    const feedNote =
      feed === 'all' && pol && corp
        ? ` ${pol} Congress and ${corp} corporate signals.`
        : '';
    return `Listed ${signals.length} rule-flagged trades (${buys} buys, ${sells} sells/other); ${high} high ML tier. Tickers in focus: ${tickers.join(', ')}.${feedNote} Sorted by ML score — not investment advice.`;
  }

  const feedNote =
    feed === 'all' && pol && corp
      ? locale === 'zh-Hans'
        ? ` 其中国会 ${pol} 条、企业 ${corp} 条。`
        : ` 其中國會 ${pol} 則、企業 ${corp} 則。`
      : '';
  const tierNote =
    locale === 'zh-Hans'
      ? high > 0
        ? `其中 ${high} 条为高评分。`
        : ''
      : high > 0
        ? `其中 ${high} 則為高評分。`
        : '';

  if (locale === 'zh-Hans') {
    return `共 ${signals.length} 条规则标记交易（买入 ${buys}、卖出/其他 ${sells}），${tierNote}标的侧重：${tickers.join('、')}。${feedNote}按 ML 评分排序，仅供研究，非投资建议。`;
  }

  return `共 ${signals.length} 則規則標記交易（買入 ${buys}、賣出/其他 ${sells}），${tierNote}標的側重：${tickers.join('、')}。${feedNote}按 ML 評分排序，僅供研究，非投資建議。`;
}

async function readCached(
  period: MobilePeriod,
  feed: SignalFeed,
  locale: BriefLocale,
  fingerprint: string,
): Promise<SignalsAiSummary | null> {
  const file = path.join(
    CACHE_DIR,
    `signals-brief-${period}-${feed}-${locale}.json`,
  );
  try {
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw) as {
      fingerprint: string;
      cachedAt: string;
      brief: SignalsAiSummary;
    };
    if (data.fingerprint !== fingerprint) return null;
    if (Date.now() - new Date(data.cachedAt).getTime() > CACHE_TTL_MS) {
      return null;
    }
    return data.brief;
  } catch {
    return null;
  }
}

async function writeCached(
  period: MobilePeriod,
  feed: SignalFeed,
  locale: BriefLocale,
  fingerprint: string,
  brief: SignalsAiSummary,
): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(
    CACHE_DIR,
    `signals-brief-${period}-${feed}-${locale}.json`,
  );
  await fs.writeFile(
    file,
    JSON.stringify(
      { fingerprint, cachedAt: new Date().toISOString(), brief },
      null,
      2,
    ),
    'utf8',
  );
}

async function xaiSignalsNarrative(
  locale: BriefLocale,
  period: MobilePeriod,
  feed: SignalFeed,
  signals: MobileSignalItem[],
): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey || signals.length === 0) return null;

  const model = process.env.XAI_MODEL?.trim() || 'grok-2-latest';
  const lang =
    locale === 'zh-Hans'
      ? 'Simplified Chinese'
      : locale === 'zh-Hant'
        ? 'Traditional Chinese'
        : 'English';

  const buys = signals.filter((s) => s.side === 'buy').length;
  const sells = signals.length - buys;
  const high = signals.filter((s) => s.mlTier === 'high').length;

  const lines = signals.slice(0, XAI_SIGNAL_CAP).map((s, i) => {
    const who =
      s.feed === 'corporate'
        ? `${s.politicianName} (insider)`
        : `${s.politicianName} (${s.party})`;
    return `${i + 1}. [${s.feed}] ${who} ${s.side} ${s.ticker} ${formatUsd(s.amountUsd)} flags=${s.flags.join(',')} ml=${s.mlScore}/${s.mlTier} filed=${s.filedAt}`;
  });

  const system = `You write brief summaries for a mobile "flagged insider/politician signals" feed. Write in ${lang}. One cohesive paragraph (3-5 sentences): period context, buy/sell balance, standout tickers and names, rule-flag themes (clusters, notable size, committee). Use ONLY the listed signals. End with a short disclaimer that this is research context, not investment advice. No bullet points.`;

  const user = `Window: past ${period}. Feed filter: ${feed}.
AGGREGATE: ${signals.length} flagged signals (${buys} buys, ${sells} sells/other), ${high} high ML tier.

SIGNALS (sorted by ML score):
${lines.join('\n')}
${signals.length > XAI_SIGNAL_CAP ? `\n(... ${signals.length - XAI_SIGNAL_CAP} more omitted)` : ''}`;

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 500,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (!res.ok) {
      console.warn('xAI signals brief failed', res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.warn('xAI signals brief error', e);
    return null;
  }
}

export async function getSignalsBrief(
  signals: MobileSignalItem[],
  period: MobilePeriod,
  feed: SignalFeed,
  locale: BriefLocale = 'zh-Hant',
): Promise<SignalsAiSummary> {
  const fp = signalFingerprint(signals);
  const cached = await readCached(period, feed, locale, fp);
  if (cached) return cached;

  const sentiment = sentimentFromSignals(signals);
  const headline = rulesHeadline(locale, period, feed, signals.length);
  const bullets = rulesBullets(locale, signals);
  const narrative =
    (await xaiSignalsNarrative(locale, period, feed, signals)) ||
    rulesNarrative(locale, period, feed, signals);

  const brief: SignalsAiSummary = {
    headline,
    narrative,
    bullets: narrative ? [] : bullets,
    sentiment,
  };

  await writeCached(period, feed, locale, fp, brief);
  return brief;
}
