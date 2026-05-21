#!/usr/bin/env node
/**
 * Force-regenerate mobile AI digests on production (xAI/Grok).
 *
 * Usage:
 *   ADMIN_TOKEN=... node scripts/warm-mobile-daily-brief.js
 *   node scripts/warm-mobile-daily-brief.js --url https://www.insiderflow.asia
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const baseUrl = (() => {
  const i = process.argv.indexOf('--url');
  if (i >= 0) return process.argv[i + 1];
  return 'https://www.insiderflow.asia';
})();

async function warmRemote() {
  const token = process.env.ADMIN_TOKEN?.trim();
  if (!token) throw new Error('ADMIN_TOKEN required');

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/admin/warm-daily-brief`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
    },
    body: JSON.stringify({ force: true, locales: ['zh-Hant', 'zh-Hans', 'en', 'ko'] }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  console.log(JSON.stringify(json, null, 2));
}

async function warmViaDashboard() {
  const modes = ['politician', 'insider'];
  const locales = ['zh-Hant', 'zh-Hans', 'en', 'ko'];
  const out = [];
  for (const mode of modes) {
    for (const locale of locales) {
      const url = `${baseUrl.replace(/\/$/, '')}/api/mobile/dashboard?mode=${mode}&period=7D&locale=${locale}`;
      const res = await fetch(url);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`${mode}/${locale}: HTTP ${res.status}`);
      out.push({
        mode,
        locale,
        headline: json.aiSummary?.headline,
        narrativePreview: json.aiSummary?.narrative?.slice(0, 120),
        generatedAt: json.meta?.generatedAt,
      });
    }
  }
  console.log(JSON.stringify({ ok: true, method: 'dashboard', briefs: out }, null, 2));
}

(async () => {
  try {
    await warmRemote();
  } catch (e) {
    if (String(e.message).includes('HTTP 404') || String(e.message).includes('Cannot POST')) {
      console.warn('Admin warm route not deployed; falling back to dashboard refresh…');
      await warmViaDashboard();
      return;
    }
    throw e;
  }
})().catch((e) => {
  console.error(e.message || e);
  process.exitCode = 1;
});
