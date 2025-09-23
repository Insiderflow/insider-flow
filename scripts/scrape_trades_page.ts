import { firefox } from 'playwright';

type TradeRow = {
  tradeId: string;
  politicianId: string;
  politicianName: string;
  issuerId: string;
  issuerName: string;
  ticker?: string | null;
  publishedAt?: string | null;
  tradedAt?: string | null;
  filedAfterDays?: number | null;
  owner?: string | null;
  type?: 'buy' | 'sell' | null;
  sizeMin?: number | null;
  sizeMax?: number | null;
  price?: number | null;
  detailUrl: string;
};

function parseSizeRange(text: string): { min?: number; max?: number } {
  const clean = text.replace(/[ ,]/g, '').toUpperCase();
  const [a, b] = clean.split(/–|-/);
  const parseOne = (v?: string) => {
    if (!v) return undefined;
    const multiplier = v.endsWith('K') ? 1_000 : v.endsWith('M') ? 1_000_000 : 1;
    return Number(v.replace(/[^0-9.]/g, '')) * multiplier;
  };
  return { min: parseOne(a), max: parseOne(b) };
}

async function main() {
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.capitoltrades.com/trades', { waitUntil: 'networkidle' });
  await page.waitForSelector('table');

  const rows = await page.$$eval('table tbody tr', (trs) =>
    trs.slice(0, 50).map((tr) => {
      const q = (sel: string) => tr.querySelector(sel) as HTMLElement | null;

      const polCell = q('td:nth-child(1)');
      const polLink = polCell?.querySelector('a[href^="/politicians/"]') as HTMLAnchorElement | null;
      const politicianName = polLink?.textContent?.trim() || '';
      const politicianHref = polLink?.getAttribute('href') || '';
      const politicianId = politicianHref.split('/').pop() || '';

      const issuerCell = q('td:nth-child(2)');
      const issuerLink = issuerCell?.querySelector('a[href^="/issuers/"]') as HTMLAnchorElement | null;
      const issuerNameFull = issuerLink?.textContent?.trim() || '';
      const issuerHref = issuerLink?.getAttribute('href') || '';
      const issuerId = issuerHref.split('/').pop() || '';
      const m = issuerNameFull.match(/^(.*?)([A-Z.\-]+:[A-Z]+)$/);
      const issuerName = m ? m[1].trim() : issuerNameFull;
      const ticker = m ? m[2].split(':')[0] : null;

      const publishedAt = q('td:nth-child(3)')?.textContent?.trim() || null;
      const tradedAt = q('td:nth-child(4)')?.textContent?.trim() || null;
      const filedAfterText = q('td:nth-child(5)')?.textContent?.trim() || '';
      const filedAfterDays = filedAfterText ? Number((filedAfterText.match(/\d+/) || [null])[0]) : null;
      const owner = q('td:nth-child(6)')?.textContent?.trim() || null;
      const type = (q('td:nth-child(7)')?.textContent?.trim().toLowerCase() as 'buy' | 'sell' | null) || null;

      const sizeText = q('td:nth-child(8)')?.textContent?.trim() || '';
      const priceText = q('td:nth-child(9)')?.textContent?.trim() || '';
      const price = priceText && priceText !== 'N/A' ? Number(priceText.replace(/[^0-9.]/g, '')) : null;

      const detailLink = (q('td:nth-child(10) a') as HTMLAnchorElement | null)?.getAttribute('href') || '';
      const tradeId = detailLink.split('/').pop() || '';

      return {
        tradeId,
        politicianId,
        politicianName,
        issuerId,
        issuerName,
        ticker,
        publishedAt,
        tradedAt,
        filedAfterDays,
        owner,
        type,
        sizeText,
        price,
        detailUrl: `https://www.capitoltrades.com${detailLink}`,
      } as any;
    })
  );

  const normalized: TradeRow[] = (rows as any[]).map((r) => {
    const { min, max } = parseSizeRange((r as any).sizeText || '');
    const { sizeText, ...rest } = r as any;
    return { ...rest, sizeMin: min ?? null, sizeMax: max ?? null } as TradeRow;
  });

  console.log(JSON.stringify(normalized, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


