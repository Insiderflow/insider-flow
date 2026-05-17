/** Drop corrupt future-dated Capitol rows that break period filters. */
const MIN_TRADE_DATE = new Date('2010-01-01T00:00:00.000Z');

export function politicianTradedAtRange(since?: Date) {
  const now = new Date();
  const gte = since && since > MIN_TRADE_DATE ? since : MIN_TRADE_DATE;
  return { gte, lte: now };
}

export function politicianTradeWhere(since?: Date) {
  return { traded_at: politicianTradedAtRange(since) };
}

/** Capitol dashboard periods: filter by disclosure publish time, not trade execution date. */
export function politicianPublishedRange(since?: Date) {
  const now = new Date();
  const gte = since && since > MIN_TRADE_DATE ? since : MIN_TRADE_DATE;
  return { gte, lte: now };
}

export function politicianPublishedWhere(since?: Date) {
  const range = politicianPublishedRange(since);
  return {
    OR: [
      { published_at: range },
      { published_at: null, traded_at: politicianTradedAtRange(since) },
    ],
  };
}

/** YYYY-MM-DD in US Eastern (Congress disclosure context). */
export function etCalendarYmd(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

export function isEtCalendarDay(d: Date, ref: Date = new Date()): boolean {
  return etCalendarYmd(d) === etCalendarYmd(ref);
}

/** Add calendar days in US Eastern (YYYY-MM-DD in, YYYY-MM-DD out). */
export function addEtCalendarDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return etCalendarYmd(new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0)));
}

/** Half-open UTC range [gte, lt) for one America/New_York calendar day. */
export function etDayUtcRange(ymd: string): { gte: Date; lt: Date } {
  return {
    gte: etWallClockToUtc(ymd, 0, 0, 0, 0),
    lt: etWallClockToUtc(addEtCalendarDays(ymd, 1), 0, 0, 0, 0),
  };
}

function etWallClockParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '0';
  return {
    ymd: `${get('year')}-${get('month')}-${get('day')}`,
    h: Number(get('hour')),
    mi: Number(get('minute')),
    s: Number(get('second')),
  };
}

function etWallClockToUtc(
  ymd: string,
  hour: number,
  minute: number,
  second: number,
  ms: number,
): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  let guess = Date.UTC(y, m - 1, d, hour + 5, minute, second, ms);
  for (let i = 0; i < 96; i++) {
    const p = etWallClockParts(new Date(guess));
    const match =
      p.ymd === ymd && p.h === hour && p.mi === minute && p.s === second;
    if (match) return new Date(guess);
    const target = Date.UTC(y, m - 1, d, hour, minute, second);
    const actual = Date.UTC(
      Number(p.ymd.slice(0, 4)),
      Number(p.ymd.slice(5, 7)) - 1,
      Number(p.ymd.slice(8, 10)),
      p.h,
      p.mi,
      p.s,
    );
    guess += target - actual;
  }
  return new Date(guess);
}
