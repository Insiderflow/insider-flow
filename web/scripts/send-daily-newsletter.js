/*
 Minimal daily newsletter sender (Chinese), targeting a single test recipient.
 - Selects new trades in the Hong Kong day window (HKT) based on created_at
 - Renders concise HTML digest in Chinese
 - Sends via SendGrid if SENDGRID_API_KEY is present; otherwise dry-run prints preview
 - Usage: node scripts/send-daily-newsletter.js [testEmail]
*/

const { PrismaClient } = require('@prisma/client');
const sgMail = require('@sendgrid/mail');

const prisma = new PrismaClient();

function getHktWindowUtc(now = new Date()) {
  // Compute today's start/end in HKT and convert to UTC for DB filter
  // HKT is UTC+8
  const utcMs = now.getTime();
  const hktOffsetMs = 8 * 60 * 60 * 1000;
  const hktNow = new Date(utcMs + hktOffsetMs);
  const startHkt = new Date(hktNow);
  startHkt.setHours(0, 0, 0, 0);
  const endHkt = new Date(startHkt.getTime() + 24 * 60 * 60 * 1000);
  // convert back to UTC by subtracting offset
  const startUtc = new Date(startHkt.getTime() - hktOffsetMs);
  const endUtc = new Date(endHkt.getTime() - hktOffsetMs);
  return { startUtc, endUtc, startHkt, endHkt };
}

function formatDate(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtml(trades, dateLabel) {
  const ctaUrl = process.env.NEWSLETTER_CTA_URL || 'https://insiderflow.asia';
  if (!trades.length) {
    return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Noto Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif; line-height:1.6; color:#111;">
  <h2 style="margin:0 0 12px;">【每日內幕交易】${escapeHtml(dateLabel)}</h2>
  <p>今日沒有新增內幕交易。</p>
  <p><a href="${escapeHtml(ctaUrl)}" target="_blank" style="display:inline-block; background:#111; color:#fff; text-decoration:none; padding:10px 14px; border-radius:6px;">查看更多交易，請點此</a></p>
  <p style="color:#666; font-size:12px;">此為測試郵件。</p>
  <hr style="border:none;border-top:1px solid #eee; margin:16px 0;" />
  <div style="color:#999; font-size:12px;">若不想再收到此訊息，請於帳戶關閉訂閱。</div>
</div>`;
  }

  const items = trades.map(t => {
    const ticker = t.issuer_ticker || (t.raw?.ticker) || '-';
    const company = t.issuer_name || (t.raw?.issuerName) || '-';
    const pol = t.politician_name || (t.raw?.politicianName) || '-';
    const type = t.type;
    const sizeText = (t.raw?.sizeText) || `${t.size_min || ''}-${t.size_max || ''}`;
    const tradedAt = t.traded_at ? formatDate(t.traded_at) : '-';
    return `
    <tr>
      <td style="padding:8px 6px;">${escapeHtml(ticker)}</td>
      <td style="padding:8px 6px;">${escapeHtml(company)}</td>
      <td style="padding:8px 6px;">${escapeHtml(pol)}</td>
      <td style="padding:8px 6px;">${escapeHtml(type)}</td>
      <td style="padding:8px 6px; white-space:nowrap;">${escapeHtml(sizeText)}</td>
      <td style="padding:8px 6px; white-space:nowrap;">${escapeHtml(tradedAt)}</td>
    </tr>`;
  }).join('');

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Noto Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif; line-height:1.6; color:#111;">
  <h2 style="margin:0 0 12px;">【每日內幕交易】${escapeHtml(dateLabel)} 新增 ${trades.length} 筆</h2>
  <table style="border-collapse:collapse; width:100%; max-width:900px;">
    <thead>
      <tr style="background:#fafafa;">
        <th style="text-align:left; padding:8px 6px;">代號</th>
        <th style="text-align:left; padding:8px 6px;">公司</th>
        <th style="text-align:left; padding:8px 6px;">政治人物</th>
        <th style="text-align:left; padding:8px 6px;">類型</th>
        <th style="text-align:left; padding:8px 6px;">金額/區間</th>
        <th style="text-align:left; padding:8px 6px;">交易日</th>
        
      </tr>
    </thead>
    <tbody>
      ${items}
    </tbody>
  </table>
  <p style="margin:16px 0 0;">
    <a href="${escapeHtml(ctaUrl)}" target="_blank" style="display:inline-block; background:#111; color:#fff; text-decoration:none; padding:10px 14px; border-radius:6px;">查看更多交易，請點此</a>
  </p>
  <p style="color:#666; font-size:12px;">此為測試郵件（單一收件者）。</p>
  <hr style="border:none;border-top:1px solid #eee; margin:16px 0;" />
  <div style="color:#999; font-size:12px;">若不想再收到此訊息，請於帳戶關閉訂閱。</div>
  
</div>`;
}

async function main() {
  const targetEmail = process.argv[2] || process.env.TEST_NEWSLETTER_EMAIL || 'outcastghostmanagement@gmail.com';
  const sendgridKey = process.env.SENDGRID_API_KEY;

  const { startUtc, endUtc, startHkt } = getHktWindowUtc();
  const dateLabel = formatDate(startHkt);

  console.log(`HKT window (UTC): ${startUtc.toISOString()} ~ ${endUtc.toISOString()}`);

  // Fetch new trades created today (HKT window) with issuer/politician via SQL join
  const trades = await prisma.$queryRaw`
    SELECT 
      t.id,
      t.politician_id,
      t.issuer_id,
      t.traded_at,
      t.type,
      t.size_min,
      t.size_max,
      t.published_at,
      t.owner,
      t.price,
      t.source_url,
      t.raw,
      t.created_at,
      i.ticker AS issuer_ticker,
      i.name   AS issuer_name,
      p.name   AS politician_name
    FROM "Trade" t
    LEFT JOIN "Issuer" i ON i.id = t.issuer_id
    LEFT JOIN "Politician" p ON p.id = t.politician_id
    WHERE t.traded_at >= ${startUtc} AND t.traded_at < ${endUtc}
    ORDER BY t.traded_at DESC NULLS LAST, t.created_at DESC
    LIMIT 200
  `;

  const html = renderHtml(trades, dateLabel);
  const subject = `【每日內幕交易】${dateLabel} 新增 ${trades.length} 筆`;

  if (!sendgridKey) {
    console.log('SENDGRID_API_KEY not set. Dry run preview below:');
    console.log('Subject:', subject);
    console.log('To:', targetEmail);
    console.log('HTML preview (first 1000 chars):');
    console.log(html.slice(0, 1000));
    return;
  }

  sgMail.setApiKey(sendgridKey);

  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || 'team@insiderflow.asia';
  const fromName = process.env.NEWSLETTER_FROM_NAME || 'Insider Flow';

  const msg = {
    to: targetEmail,
    from: {
      email: fromEmail,
      name: fromName
    },
    subject,
    html
  };

  try {
    const res = await sgMail.send(msg);
    console.log('Email sent. Status:', res?.[0]?.statusCode);
  } catch (err) {
    console.error('SendGrid error:', err?.response?.body || err.message);
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


