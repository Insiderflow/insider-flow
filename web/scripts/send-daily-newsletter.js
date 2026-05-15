/*
 Daily newsletter sender for paid members (Chinese).
 - HKT calendar day via Intl (Asia/Hong_Kong), not host TZ.
 - Rows included if created_at OR published_at falls in that UTC window (new inserts + same-day disclosures).
 - Re-imports that only bump published_at to a past date still need Trade.updated_at (future schema) — see OR below.
 - Usage: node scripts/send-daily-newsletter.js [testEmail] (optional test mode)
*/

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const path = require('path');
const { PrismaClient } = require('@prisma/client');
const sgMail = require('@sendgrid/mail');
const { getHktDayBoundsUtc } = require(path.join(__dirname, 'lib', 'hkt-day-window.js'));

const prisma = new PrismaClient();

// Rate limiting: SendGrid allows 100 emails/second, we'll use 50/sec to be safe
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000; // 1 second between batches

/** GitHub Actions secrets often include a trailing newline; SendGrid then returns "invalid grant". */
function normalizeSendGridApiKey(raw) {
  if (raw == null) return '';
  return String(raw).trim().replace(/^\uFEFF/, '');
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

function cleanPoliticianName(name) {
  if (!name) return '-';
  
  // Remove common metadata patterns that might be concatenated
  // Patterns like: "Name Democrat", "Name Republican", "Name New York", "Name Trades", etc.
  let cleaned = name.trim();
  
  // First, add spaces before capital letters that follow lowercase (handle "DemocratNew" -> "Democrat New")
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // Remove party names (with or without spaces)
  cleaned = cleaned.replace(/\s*(Democrat|Republican|Independent|Libertarian|Green|Other)\s*/gi, ' ');
  
  // Remove state names (common US states - handle multi-word states first)
  const multiWordStates = ['New York', 'New Hampshire', 'New Jersey', 'New Mexico', 'North Carolina', 'North Dakota', 'South Carolina', 'South Dakota', 'West Virginia', 'Rhode Island'];
  multiWordStates.forEach(state => {
    cleaned = cleaned.replace(new RegExp(`\\s*${state}\\s*`, 'gi'), ' ');
  });
  
  const singleWordStates = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'Wisconsin', 'Wyoming'];
  singleWordStates.forEach(state => {
    cleaned = cleaned.replace(new RegExp(`\\s*${state}\\s*`, 'gi'), ' ');
  });
  
  // Remove metadata patterns like "Trades123", "Issuers456", "Volume", "Last Traded"
  cleaned = cleaned.replace(/\s*(Trades|Issuers|Volume|Last\s+Traded)[\d\w\s,.-]*$/gi, '');
  
  // Remove numbers and special patterns at the end
  cleaned = cleaned.replace(/\s+\d+[\d,.\w\s]*$/, '');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Take only the first 4 words (typically: First Middle Last Suffix)
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 4) {
    cleaned = words.slice(0, 4).join(' ');
  }
  
  return cleaned.trim() || name.trim().split(/\s+/).slice(0, 3).join(' ') || '-';
}

function renderHtml(trades, dateLabel) {
  const ctaUrl = process.env.NEWSLETTER_CTA_URL || 'https://insiderflow.asia';
  if (!trades.length) {
    return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Noto Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif; line-height:1.6; color:#111;">
  <h2 style="margin:0 0 12px;">【每日內幕交易】${escapeHtml(dateLabel)}</h2>
  <p>今日沒有新增內幕交易。</p>
  <p><a href="${escapeHtml(ctaUrl)}" target="_blank" style="display:inline-block; background:#111; color:#fff; text-decoration:none; padding:10px 14px; border-radius:6px;">查看更多交易，請點此</a></p>
  <p style="color:#666; font-size:12px;">感謝您訂閱 Insider Flow 每日內幕交易報告。</p>
  <hr style="border:none;border-top:1px solid #eee; margin:16px 0;" />
  <div style="color:#999; font-size:12px;">若不想再收到此訊息，請於帳戶關閉訂閱。</div>
</div>`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEWSLETTER_CTA_URL || 'https://insiderflow.asia';
  
  const items = trades.map(t => {
    const ticker = t.issuer_ticker || (t.raw?.ticker) || '-';
    const company = t.issuer_name || (t.raw?.issuerName) || '-';
    const polRaw = t.politician_name || (t.raw?.politicianName) || '-';
    const pol = cleanPoliticianName(polRaw);
    const type = t.type;
    const sizeText = (t.raw?.sizeText) || `${t.size_min || ''}-${t.size_max || ''}`;
    const tradedAt = t.traded_at ? formatDate(t.traded_at) : '-';
    
    // Create clickable links
    const tickerLink = t.issuer_id ? `${baseUrl}/issuers/${t.issuer_id}` : '#';
    const politicianLink = t.politician_id ? `${baseUrl}/politicians/${t.politician_id}` : '#';
    
    return `
    <tr>
      <td style="padding:8px 6px;">
        ${t.issuer_id ? `<a href="${escapeHtml(tickerLink)}" target="_blank" style="color:#6366f1; text-decoration:none; font-weight:500;">${escapeHtml(ticker)}</a>` : escapeHtml(ticker)}
      </td>
      <td style="padding:8px 6px;">${escapeHtml(company)}</td>
      <td style="padding:8px 6px;">
        ${t.politician_id ? `<a href="${escapeHtml(politicianLink)}" target="_blank" style="color:#6366f1; text-decoration:none; font-weight:500;">${escapeHtml(pol)}</a>` : escapeHtml(pol)}
      </td>
      <td style="padding:8px 6px;">${escapeHtml(type)}</td>
      <td style="padding:8px 6px; white-space:nowrap;">${escapeHtml(sizeText)}</td>
      <td style="padding:8px 6px; white-space:nowrap;">${escapeHtml(tradedAt)}</td>
    </tr>`;
  }).join('');

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Noto Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif; line-height:1.6; color:#111;">
  <h2 style="margin:0 0 12px;">【每日內幕交易】${escapeHtml(dateLabel)} 共 ${trades.length} 筆</h2>
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
  <p style="color:#666; font-size:12px;">感謝您訂閱 Insider Flow 每日內幕交易報告。</p>
  <hr style="border:none;border-top:1px solid #eee; margin:16px 0;" />
  <div style="color:#999; font-size:12px;">若不想再收到此訊息，請於帳戶關閉訂閱。</div>
  
</div>`;
}

async function getActivePaidMembers() {
  const now = new Date();
  const allPaid = await prisma.user.findMany({
    where: {
      membership_tier: 'PAID',
      OR: [
        { membership_expires_at: null },
        { membership_expires_at: { gt: now } }
      ]
    },
    select: {
      id: true,
      email: true,
      name: true
    }
  });
  // Filter out users without email addresses
  return allPaid.filter(u => u.email && u.email.trim().length > 0);
}

async function sendEmailBatch(emails, subject, html, fromEmail, fromName) {
  const messages = emails.map(email => ({
    to: email,
    from: {
      email: fromEmail,
      name: fromName
    },
    subject,
    html
  }));

  try {
    await sgMail.send(messages);
    return { success: emails.length, failed: 0 };
  } catch (err) {
    console.error('SendGrid batch error:', err?.response?.body || err.message);
    // Try sending individually if batch fails
    let success = 0;
    let failed = 0;
    for (const email of emails) {
      try {
        await sgMail.send({
          to: email,
          from: { email: fromEmail, name: fromName },
          subject,
          html
        });
        success++;
      } catch (e) {
        console.error(`Failed to send to ${email}:`, e?.response?.body || e.message);
        failed++;
      }
    }
    return { success, failed };
  }
}

async function main() {
  const testEmail = process.argv[2] || process.env.TEST_NEWSLETTER_EMAIL;
  const sendgridKey = normalizeSendGridApiKey(process.env.SENDGRID_API_KEY);

  // For testing: use a specific date with actual trades
  const useTestDate = process.argv[3] === '--test-date' || process.env.USE_TEST_DATE === 'true';
  let targetDate = new Date();
  if (useTestDate) {
    // Use November 14, 2024 which has trades (stored at 16:00 UTC = midnight HKT Nov 15)
    targetDate = new Date('2024-11-14T12:00:00Z');
  }

  const { startUtc, endUtc, dateLabel } = getHktDayBoundsUtc(targetDate);

  console.log(`📅 HKT window (UTC): ${startUtc.toISOString()} ~ ${endUtc.toISOString()}`);

  // created_at: brand-new rows. published_at: disclosure calendar lands on this HKT day (row may be old).
  // Still misses "only raw/issuer touched" updates without updated_at — add Trade.updated_at if needed.
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
    WHERE (
      (t.created_at >= ${startUtc} AND t.created_at < ${endUtc})
      OR (t.published_at IS NOT NULL AND t.published_at >= ${startUtc} AND t.published_at < ${endUtc})
    )
    ORDER BY GREATEST(t.created_at, COALESCE(t.published_at, t.created_at)) DESC NULLS LAST
    LIMIT 200
  `;

  console.log(`📊 Found ${trades.length} trades for digest (${dateLabel} HKT)`);

  const html = renderHtml(trades, dateLabel);
  const subject = `【每日內幕交易】${dateLabel} 共 ${trades.length} 筆`;

  if (!sendgridKey) {
    console.log('⚠️  SENDGRID_API_KEY not set. Dry run preview below:');
    console.log('Subject:', subject);
    if (testEmail) {
      console.log('Test To:', testEmail);
    } else {
      console.log('Would send to all paid members');
    }
    console.log('HTML preview (first 1000 chars):');
    console.log(html.slice(0, 1000));
    if (process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true') {
      console.error(
        '\n❌ CI detected: set repository secret SENDGRID_API_KEY or the job will never send mail (dry run only).'
      );
      process.exitCode = 1;
    }
    return;
  }

  sgMail.setApiKey(sendgridKey);

  const fromEmail = String(
    process.env.NEWSLETTER_FROM_EMAIL ||
      process.env.SENDGRID_FROM_EMAIL ||
      'team@insiderflow.asia'
  ).trim();
  const fromName = String(process.env.NEWSLETTER_FROM_NAME || 'Insider Flow').trim();

  // Test mode: send to single email
  if (testEmail) {
    console.log(`🧪 Test mode: sending to ${testEmail}`);
    try {
      const res = await sgMail.send({
        to: testEmail,
        from: { email: fromEmail, name: fromName },
        subject,
        html
      });
      console.log('✅ Test email sent. Status:', res?.[0]?.statusCode);
    } catch (err) {
      console.error('❌ SendGrid error:', err?.response?.body || err.message);
      process.exitCode = 1;
    }
    return;
  }

  // Production mode: send to all paid members only (not free / not unverified)
  console.log(
    '\n📣 Newsletter audience: active PAID members only (membership_tier=PAID, subscription not expired). FREE accounts are excluded.\n'
  );
  const members = await getActivePaidMembers();
  console.log(`👥 Found ${members.length} active paid members`);

  if (members.length === 0) {
    console.log(
      '⚠️  No paid members to send to — if you expected mail at your Gmail, confirm your user row is PAID and membership_expires_at is null or future.'
    );
    return;
  }

  const emails = members.map(m => m.email).filter(Boolean);
  console.log(`📧 Sending to ${emails.length} members in batches of ${BATCH_SIZE}...`);

  let totalSuccess = 0;
  let totalFailed = 0;

  // Send in batches to respect rate limits
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    console.log(`📤 Sending batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(emails.length / BATCH_SIZE)} (${batch.length} emails)...`);
    
    const result = await sendEmailBatch(batch, subject, html, fromEmail, fromName);
    totalSuccess += result.success;
    totalFailed += result.failed;

    // Wait between batches (except for the last one)
    if (i + BATCH_SIZE < emails.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  console.log(`\n✅ Newsletter sent!`);
  console.log(`   Success: ${totalSuccess}`);
  console.log(`   Failed: ${totalFailed}`);
  
  if (totalFailed > 0) {
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


