/** @param {string} dateStr */
function parseCapitolDate(dateStr) {
  if (!dateStr || dateStr === 'N/A') return null;

  const today = new Date();

  if (dateStr.includes('Yesterday')) {
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (timeMatch) yesterday.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
    return yesterday.toISOString();
  }

  if (dateStr.includes('Today')) {
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
    const date = new Date(today);
    if (timeMatch) date.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
    return date.toISOString();
  }

  // "23 Sept2025" / "16 May2026" (month jammed against year)
  const compact = dateStr.match(/^(\d{1,2})\s+([A-Za-z]+)(\d{4})$/);
  if (compact) {
    const day = parseInt(compact[1], 10);
    const year = parseInt(compact[3], 10);
    const monthKey = compact[2].slice(0, 3).toLowerCase();
    const months = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const monthNum = months[monthKey];
    if (monthNum !== undefined) {
      return new Date(Date.UTC(year, monthNum, day, 12, 0, 0)).toISOString();
    }
  }

  if (dateStr.startsWith('days')) return null;

  const parsed = new Date(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** @param {Array<{ publishedAt?: string | null, tradedAt?: string | null }>} rows */
function scrapeDateStats(rows) {
  let maxPublished = null;
  let maxTraded = null;
  for (const row of rows) {
    if (row.publishedAt && (!maxPublished || row.publishedAt > maxPublished)) {
      maxPublished = row.publishedAt;
    }
    if (row.tradedAt && (!maxTraded || row.tradedAt > maxTraded)) {
      maxTraded = row.tradedAt;
    }
  }
  return { maxPublished, maxTraded, rowCount: rows.length };
}

module.exports = { parseCapitolDate, scrapeDateStats };
