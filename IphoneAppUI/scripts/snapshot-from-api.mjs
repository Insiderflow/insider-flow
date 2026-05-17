/**
 * One-time capture of mobile BFF responses into src/data/snapshots/.
 * Run while insider-flow/web is up: npm run snapshot
 *
 * Re-run only when you want to refresh the frozen dataset for UI work.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'src/data/snapshots');
const PORT_CANDIDATES = (process.env.SNAPSHOT_API_PORTS || '3000,3001,3002,3003')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

let BASE = process.env.SNAPSHOT_API_BASE || '';

function helpText(base) {
  return `
Snapshot failed — API did not return JSON.

1. Start the backend:
   cd insider-flow/web && npm run dev
   (Note the port in the terminal — if not 3000, use SNAPSHOT_API_BASE)

2. Kill stale servers on :3000 if Next picked another port:
   lsof -ti :3000 | xargs kill -9
   cd insider-flow/web && rm -rf .next && npm run dev

3. Verify JSON:
   curl -s "${base || 'http://localhost:3000'}/api/mobile/dashboard?mode=politician&period=7D" | head -c 80

4. Re-run: cd IphoneAppUI && npm run snapshot
`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    const hint =
      text.trimStart().startsWith('<!') || contentType.includes('text/html')
        ? ' (HTML error page — is insider-flow/web running? try rm -rf .next && npm run dev)'
        : '';
    throw new Error(`${url} → ${res.status}${hint}: ${text.slice(0, 180)}`);
  }

  if (text.trimStart().startsWith('<') || !contentType.includes('json')) {
    throw new Error(
      `${url} → expected JSON but got ${contentType || 'unknown'}: ${text.slice(0, 120)}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${url} → invalid JSON: ${text.slice(0, 120)}`);
  }
}

async function resolveApiBase() {
  if (BASE) return BASE;

  for (const port of PORT_CANDIDATES) {
    const candidate = `http://localhost:${port}`;
    const url = `${candidate}/api/mobile/dashboard?mode=politician&period=7D`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (res.ok && text.trimStart().startsWith('{')) {
        const data = JSON.parse(text);
        if (data?.meta?.dataAsOf != null) {
          BASE = candidate;
          console.log(`Using API at ${BASE} (port ${port})\n`);
          return BASE;
        }
      }
    } catch {
      /* try next port */
    }
  }

  throw new Error(
    `No mobile API found on ports ${PORT_CANDIDATES.join(', ')}. Start insider-flow/web (npm run dev).`
  );
}

async function preflight() {
  await resolveApiBase();
  const url = `${BASE}/api/mobile/dashboard?mode=politician&period=7D`;
  console.log('Preflight:', url);
  await fetchJson(url);
  console.log('  OK\n');
}

function writeJson(relPath, data) {
  const full = path.join(OUT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
  console.log('  wrote', relPath);
}

function collectTargets(dashboard) {
  const persons = new Set();
  const companies = new Set();
  const issuerIds = new Set();

  const addPerson = (id) => {
    if (!id || id === '—') return;
    persons.add(id);
  };

  const addCompanyTicker = (ticker) => {
    if (!ticker || ticker === '—') return;
    companies.add(`company-${ticker.toLowerCase()}`);
  };

  for (const list of [dashboard.topPoliticianBuys, dashboard.topPoliticianSells]) {
    for (const row of list || []) {
      addPerson(row.politicianId || row.id);
      addCompanyTicker(row.ticker);
    }
  }

  for (const row of dashboard.recentTrades || []) {
    addPerson(row.politicianId);
    addCompanyTicker(row.ticker);
  }

  for (const list of [dashboard.clusterBuys, dashboard.clusterSells]) {
    for (const c of list || []) {
      for (const tk of c.tickers || []) addCompanyTicker(tk);
      if (c.ticker) addCompanyTicker(c.ticker);
      if (c.issuerId) issuerIds.add(c.issuerId);
    }
  }

  const extras = dashboard.insiderExtras;
  if (extras) {
    for (const list of [
      extras.highlightsBuy,
      extras.highlightsSell,
      extras.companyClustersBuy,
      extras.companyClustersSell,
    ]) {
      for (const row of list || []) {
        if (row.entityType === 'person') addPerson(row.id);
        else if (row.ticker) addCompanyTicker(row.ticker);
        else if (row.id?.startsWith('company-')) companies.add(row.id);
      }
    }
  }

  for (const row of dashboard.recentTrades || []) {
    if (row.issuerId) issuerIds.add(row.issuerId);
  }

  return { persons: [...persons], companies: [...companies], issuers: [...issuerIds] };
}

function collectIndustrySectors(dashboards) {
  const sectors = new Set();
  for (const d of Object.values(dashboards)) {
    for (const s of d.topIndustries || []) {
      if (s.nameKey) sectors.add(s.nameKey);
    }
    for (const n of d.industryChain || []) {
      if (n.nameKey) sectors.add(n.nameKey);
    }
  }
  return [...sectors];
}

function industryRelPath(sector, side, period) {
  const safe = sector.replace(/[^a-zA-Z0-9_-]+/g, '_');
  return `industry/${safe}-${side}-${period}.json`;
}

async function fetchPersonProfile(id) {
  if (id.startsWith('person-')) {
    const ownerId = id.replace(/^person-/, '');
    return fetchJson(
      `${BASE}/api/mobile/person-profile?ownerId=${encodeURIComponent(ownerId)}`
    );
  }
  return fetchJson(
    `${BASE}/api/mobile/person-profile?politicianId=${encodeURIComponent(id)}`
  );
}

async function fetchCompanyProfile(companyRouteId) {
  const ticker = companyRouteId.replace(/^company-/i, '');
  return fetchJson(
    `${BASE}/api/mobile/company-profile?ticker=${encodeURIComponent(ticker)}`
  );
}

async function fetchIssuerProfile(issuerIdOrTicker) {
  return fetchJson(
    `${BASE}/api/mobile/issuer-profile?issuerId=${encodeURIComponent(issuerIdOrTicker)}`
  );
}

/** Issuers with politician trades in the last N days (production DB). */
const RECENT_ISSUER_IDS = [
  '431262', // DXCM — 2026-05-07
  '432457', // PODD — 2026-05-07
  '2335407', // TCNNF — 2026-05-06
  '431330', // DASH — 2026-05-01
  '430403', // CARR — 2026-05-01
  '435818', // W — 2026-05-01
  '434919', // SSNC — 2026-05-01
  '434652', // PLCST — 2026-05-01
];

async function main() {
  console.log(`Snapshot API base: ${BASE}\n`);

  await preflight();

  const periods = ['1D', '7D', '30D'];
  const modes = ['politician', 'insider'];
  const dashboards = {};

  for (const mode of modes) {
    for (const period of periods) {
      const key = `${mode}-${period}`;
      const data = await fetchJson(
        `${BASE}/api/mobile/dashboard?mode=${mode}&period=${period}`
      );
      writeJson(`dashboard-${key}.json`, data);
      dashboards[key] = data;
    }
  }

  for (const mode of modes) {
    const data = await fetchJson(`${BASE}/api/mobile/live?mode=${mode}`);
    writeJson(`live-${mode}.json`, data);
  }

  const industrySectors = collectIndustrySectors(dashboards);
  const industryManifest = [];
  console.log(`\nIndustry detail (${industrySectors.length} sectors)…`);
  for (const sector of industrySectors) {
    for (const side of ['buy', 'sell']) {
      for (const period of ['7D', '30D']) {
        const rel = industryRelPath(sector, side, period);
        try {
          const data = await fetchJson(
            `${BASE}/api/mobile/industry-detail?sector=${encodeURIComponent(sector)}&side=${side}&period=${period}`
          );
          writeJson(rel, data);
          industryManifest.push({ sector, side, period, file: rel });
        } catch (e) {
          console.warn('  industry skip', sector, side, period, e.message);
        }
      }
    }
  }

  const searchQueries = ['NVDA', 'Pelosi', 'AAPL'];
  const search = {};
  for (const q of searchQueries) {
    try {
      search[q] = await fetchJson(`${BASE}/api/search?q=${encodeURIComponent(q)}`);
    } catch (e) {
      console.warn('  search skip', q, e.message);
    }
  }
  writeJson('search.json', search);

  const personIds = new Set();
  const companyIds = new Set();
  const issuerIds = new Set(RECENT_ISSUER_IDS);
  for (const d of Object.values(dashboards)) {
    const { persons, companies, issuers } = collectTargets(d);
    persons.forEach((p) => personIds.add(p));
    companies.forEach((c) => companyIds.add(c));
    issuers.forEach((i) => issuerIds.add(i));
  }

  const profileManifest = { persons: [], companies: [], issuers: [], errors: [] };

  for (const id of personIds) {
    try {
      const profile = await fetchPersonProfile(id);
      const routeId = profile.id || id;
      writeJson(`profiles/${routeId}.json`, profile);
      profileManifest.persons.push(routeId);
    } catch (e) {
      profileManifest.errors.push({ id, type: 'person', error: e.message });
      console.warn('  person skip', id, e.message);
    }
  }

  for (const id of companyIds) {
    try {
      const profile = await fetchCompanyProfile(id);
      const routeId = profile.id || id;
      writeJson(`profiles/${routeId}.json`, profile);
      profileManifest.companies.push(routeId);

      for (const insider of profile.insiders || []) {
        if (insider.id) personIds.add(insider.id);
      }
      for (const tr of profile.companyTrades || []) {
        if (tr.personId) personIds.add(tr.personId);
      }
    } catch (e) {
      profileManifest.errors.push({ id, type: 'company', error: e.message });
      console.warn('  company skip', id, e.message);
    }
  }

  for (const id of issuerIds) {
    try {
      const profile = await fetchIssuerProfile(id);
      const routeId = profile.id || id;
      writeJson(`issuers/${routeId}.json`, profile);
      profileManifest.issuers.push(routeId);
    } catch (e) {
      profileManifest.errors.push({ id, type: 'issuer', error: e.message });
      console.warn('  issuer skip', id, e.message);
    }
  }

  for (const id of personIds) {
    if (profileManifest.persons.includes(id)) continue;
    try {
      const profile = await fetchPersonProfile(id);
      const routeId = profile.id || id;
      writeJson(`profiles/${routeId}.json`, profile);
      profileManifest.persons.push(routeId);
    } catch (e) {
      profileManifest.errors.push({ id, type: 'person', error: e.message });
      console.warn('  person skip (from company)', id, e.message);
    }
  }

  writeJson('manifest.json', {
    generatedAt: new Date().toISOString(),
    apiBase: BASE,
    dashboards: Object.keys(dashboards),
    industryManifest,
    profileManifest,
  });

  console.log('\nDone. VITE_DATA_SOURCE=snapshot in .env.local — restart Vite.');
}

main().catch((e) => {
  console.error(e.message || e);
  console.error(helpText(BASE));
  process.exit(1);
});
