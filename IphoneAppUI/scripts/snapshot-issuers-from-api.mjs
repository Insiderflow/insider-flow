/**
 * Fetch issuer profiles from mobile BFF (production DB via local Next).
 * Also refreshes politician dashboards so cluster cards include issuerId.
 *
 *   cd insider-flow/web && npm run dev
 *   cd IphoneAppUI && npm run snapshot:issuers
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'src/data/snapshots');
const BASE = process.env.SNAPSHOT_API_BASE || 'http://localhost:3000';

const RECENT_ISSUER_IDS = [
  '431262', // DXCM
  '432457', // PODD
  '2335407', // TCNNF
  '431330', // DASH
  '430403', // CARR
  '435818', // W
  '434919', // SSNC
  '434652', // PLCST
  '2334685', // CAESI — 30D cluster
  '2335249', // FTAXI
  '433254', // MA
  '432035', // GS
];

async function fetchJson(url) {
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`${url} → ${res.status}: ${text.slice(0, 160)}`);
  return JSON.parse(text);
}

function writeJson(relPath, data) {
  const full = path.join(OUT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
  console.log('  wrote', relPath);
}

async function main() {
  console.log(`Issuer snapshot API: ${BASE}\n`);

  for (const period of ['7D', '30D']) {
    const data = await fetchJson(
      `${BASE}/api/mobile/dashboard?mode=politician&period=${period}`
    );
    writeJson(`dashboard-politician-${period}.json`, data);
  }

  const dash30 = await fetchJson(
    `${BASE}/api/mobile/dashboard?mode=politician&period=30D`
  );
  const issuerIds = new Set(RECENT_ISSUER_IDS);
  for (const list of [dash30.clusterBuys, dash30.clusterSells]) {
    for (const c of list || []) {
      if (c.issuerId) issuerIds.add(c.issuerId);
    }
  }

  const saved = [];
  const errors = [];
  for (const id of issuerIds) {
    try {
      const profile = await fetchJson(
        `${BASE}/api/mobile/issuer-profile?issuerId=${encodeURIComponent(id)}`
      );
      const routeId = profile.id || id;
      writeJson(`issuers/${routeId}.json`, profile);
      saved.push({ id: routeId, ticker: profile.ticker, name: profile.name });
    } catch (e) {
      errors.push({ id, error: e.message });
      console.warn('  skip', id, e.message);
    }
  }

  const manifestPath = path.join(OUT, 'manifest.json');
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  manifest.issuerSnapshotAt = new Date().toISOString();
  manifest.issuers = saved;
  if (!manifest.profileManifest) manifest.profileManifest = {};
  manifest.profileManifest.issuers = saved.map((s) => s.id);
  writeJson('manifest.json', manifest);

  console.log(`\nDone: ${saved.length} issuers (${errors.length} errors).`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
