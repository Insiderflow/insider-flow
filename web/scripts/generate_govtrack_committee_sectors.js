#!/usr/bin/env node
/**
 * Build src/data/govtrackCommitteeSectors.json from unitedstates/committees-current.yaml
 * + standing/subcommittee sector overrides (GICS 11-bucket).
 *
 *   node scripts/generate_govtrack_committee_sectors.js
 *   node scripts/generate_govtrack_committee_sectors.js --yaml /path/to/committees-current.yaml
 */

const fs = require('fs');
const path = require('path');

const SECTORS = [
  'Information Technology',
  'Financials',
  'Industrials',
  'Health Care',
  'Consumer Discretionary',
  'Communication Services',
  'Consumer Staples',
  'Energy',
  'Materials',
  'Real Estate',
  'Utilities',
];

/** @type {Record<string, string[]>} */
const STANDING = {
  HSAG: ['Consumer Staples', 'Materials'],
  HSAP: [],
  HSAS: ['Industrials'],
  HSBA: ['Financials'],
  HSBU: [],
  HSED: ['Industrials'],
  HSFA: [],
  HSFD: [],
  HSFS: ['Financials'],
  HSGO: [],
  HSHA: [],
  HSII: ['Industrials'],
  HSJU: [],
  HSPW: ['Industrials', 'Utilities', 'Materials'],
  HSRU: ['Energy', 'Utilities'],
  HSSM: ['Information Technology', 'Communication Services'],
  HSSY: ['Information Technology', 'Communication Services'],
  HSVR: [],
  HSWM: ['Financials'],
  HSIF: ['Energy', 'Utilities', 'Communication Services', 'Health Care', 'Information Technology'],
  HSVC: [],
  SSEG: ['Energy', 'Utilities'],
  SSAP: [],
  SSAS: ['Industrials'],
  SSBK: ['Financials', 'Real Estate'],
  SSBU: ['Industrials'],
  SSFI: [],
  SSFR: [],
  SSGA: [],
  SSHR: ['Health Care'],
  SSJU: [],
  SSRA: [],
  SSCM: ['Communication Services', 'Information Technology', 'Industrials', 'Consumer Discretionary'],
  SSSB: ['Consumer Discretionary', 'Financials'],
  SSSV: [],
  SSVA: [],
  SLIN: ['Communication Services', 'Industrials'],
  SLIA: ['Communication Services', 'Industrials'],
  SPAG: ['Consumer Staples', 'Materials'],
  SCNC: ['Information Technology', 'Communication Services'],
};

/** Subcommittee code (PARENT+NN) → sectors; overrides parent when set. */
/** @type {Record<string, string[]>} */
const SUB_OVERRIDES = {
  HSAG22: ['Information Technology', 'Financials'],
  HSAG16: ['Financials'],
  HSBA20: ['Financials'],
  HSBA21: ['Financials'],
  HSBA22: ['Financials'],
  HSBU10: ['Information Technology', 'Communication Services'],
  HSBU14: ['Information Technology', 'Communication Services'],
  HSBU15: ['Information Technology', 'Communication Services'],
  HSBU16: ['Information Technology', 'Communication Services'],
  HSBU31: ['Information Technology', 'Communication Services'],
  HSBU33: ['Information Technology'],
  HSIF14: ['Financials'],
  HSIF16: ['Financials'],
  HSIF17: ['Financials'],
  HSIF18: ['Financials'],
  HSPW02: ['Energy', 'Utilities'],
  HSPW03: ['Energy', 'Utilities'],
  HSPW06: ['Energy', 'Utilities'],
  HSPW13: ['Energy', 'Utilities'],
  HSRU10: ['Energy'],
  HSRU15: ['Energy', 'Utilities'],
  HSSM21: ['Information Technology'],
  HSSM22: ['Information Technology', 'Communication Services'],
  HSSY15: ['Information Technology'],
  HSSY16: ['Information Technology'],
  HSSY20: ['Information Technology', 'Communication Services'],
  SSEG10: ['Energy'],
  SSEG20: ['Energy', 'Utilities'],
  SSBA08: ['Financials'],
  SSBA10: ['Financials'],
  SSBA12: ['Financials'],
  SSBA14: ['Financials'],
  SSHR09: ['Health Care'],
  SSHR11: ['Health Care'],
  SSHR12: ['Health Care'],
  SCNC20: ['Information Technology'],
  SCNC21: ['Information Technology', 'Communication Services'],
  SCNC22: ['Information Technology', 'Communication Services'],
  HSIF03: ['Energy', 'Utilities'],
  HSIF14: ['Health Care'],
  HSIF16: ['Communication Services', 'Information Technology'],
  HSIF17: ['Consumer Discretionary', 'Communication Services'],
  HSIF18: ['Utilities', 'Materials'],
  SSCM34: ['Communication Services', 'Information Technology'],
  SSCM35: ['Information Technology', 'Communication Services'],
  SSCM37: ['Information Technology', 'Industrials'],
  SSEG10: ['Energy'],
  SSEG20: ['Energy', 'Utilities'],
};

function parseYamlCommittees(text) {
  const committees = [];
  let cur = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('- type:')) {
      if (cur) committees.push(cur);
      cur = { type: line.split(':')[1].trim(), subcommittees: [] };
      continue;
    }
    if (!cur) continue;
    const subName = line.match(/^  - name:\s*(.*)$/);
    if (subName) {
      cur.subcommittees.push({ name: subName[1].trim() });
      continue;
    }
    const subId = line.match(/^    thomas_id:\s*'?([^']*)'?$/);
    if (subId) {
      const sub = cur.subcommittees[cur.subcommittees.length - 1];
      if (sub) sub.thomas_id = subId[1].trim();
      continue;
    }
    const top = line.match(/^  ([a-z_]+):\s*(.*)$/);
    if (top && top[1] !== 'subcommittees') {
      if (top[1] === 'name') cur.name = top[2].trim();
      if (top[1] === 'thomas_id') cur.thomas_id = top[2].trim();
    }
  }
  if (cur) committees.push(cur);
  return committees;
}

function sectorsForStanding(id) {
  return STANDING[id] ? [...STANDING[id]] : [];
}

function buildMap(committees) {
  /** @type {Record<string, { sectors: string[], name?: string, parentCode?: string }>} */
  const map = {};
  for (const c of committees) {
    const parent = String(c.thomas_id || '').trim().toUpperCase();
    if (!parent) continue;
    const parentSectors = sectorsForStanding(parent);
    map[parent] = {
      sectors: parentSectors,
      name: c.name,
    };
    for (const sub of c.subcommittees || []) {
      const subId = String(sub.thomas_id || '').replace(/'/g, '').trim();
      if (!subId) continue;
      const suffix = /^\d+$/.test(subId) ? subId.padStart(2, '0') : subId;
      const codeKey = `${parent}${suffix}`;
      const normalized =
        SUB_OVERRIDES[codeKey] ?? SUB_OVERRIDES[`${parent}${subId}`] ?? null;
      const sectors =
        normalized && normalized.length
          ? [...normalized]
          : parentSectors.length
            ? [...parentSectors]
            : [];
      map[codeKey] = {
        sectors,
        name: sub.name,
        parentCode: parent,
      };
    }
  }
  return map;
}

async function main() {
  const yamlArg = process.argv.includes('--yaml')
    ? process.argv[process.argv.indexOf('--yaml') + 1]
    : null;
  const yamlPath =
    yamlArg ||
    path.join('/tmp', 'committees-current.yaml');
  if (!fs.existsSync(yamlPath)) {
    console.error(`Missing ${yamlPath}; pass --yaml or curl unitedstates yaml to /tmp`);
    process.exit(1);
  }
  const text = fs.readFileSync(yamlPath, 'utf8');
  const committees = parseYamlCommittees(text);
  const entries = buildMap(committees);
  const out = {
    version: 1,
    generatedAt: new Date().toISOString().slice(0, 10),
    sectorNames: SECTORS,
    entries,
  };
  const outPath = path.join(
    __dirname,
    '../src/data/govtrackCommitteeSectors.json',
  );
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  const withSectors = Object.values(entries).filter((e) => e.sectors.length).length;
  console.log(
    JSON.stringify(
      { path: outPath, committees: committees.length, codes: Object.keys(entries).length, withSectors },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
