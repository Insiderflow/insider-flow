'use strict';

/**
 * Inclusive start, exclusive end in UTC for the Asia/Hong_Kong civil calendar day
 * that contains `now`. Does not depend on the host machine TZ (fixes non-UTC runners).
 *
 * @param {Date} [now] anchor instant
 * @returns {{ startUtc: Date, endUtc: Date, dateLabel: string }}
 */
function getHktDayBoundsUtc(now = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const s = dtf.format(now);
  const [y, m, d] = s.split('-').map((x) => parseInt(x, 10));
  const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0) - 8 * 60 * 60 * 1000;
  const startUtc = new Date(startUtcMs);
  const endUtc = new Date(startUtcMs + 24 * 60 * 60 * 1000);
  const dateLabel = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { startUtc, endUtc, dateLabel };
}

module.exports = { getHktDayBoundsUtc };
