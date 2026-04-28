import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(projectRoot, '../../Base44UXUI/mindful-trade-signal-flow');
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const localRelaxedEnvMode = dryRun && process.env.CI !== 'true';
const skipHealthFlag = args.has('--skip-health') || process.env.RELEASE_CHECK_SKIP_HEALTH === '1';
const showFixHints = args.has('--fix-hints');
const skipPrismaFlag = args.has('--skip-prisma') || process.env.RELEASE_CHECK_SKIP_PRISMA === '1';
const skipFrontendCheckFlag = args.has('--skip-frontend-check') || process.env.RELEASE_CHECK_SKIP_FRONTEND === '1';

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function isPlaceholder(value) {
  if (!value) return true;
  const normalized = String(value).trim().toLowerCase();
  return (
    normalized === 'replace_me' ||
    normalized === 'changeme' ||
    normalized === 'todo' ||
    normalized === 'your_secret_here'
  );
}

function runCommand(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || projectRoot,
    encoding: 'utf8',
    stdio: 'pipe',
    env: {
      ...process.env,
      ...(options.env || {}),
    },
  });
  return result;
}

function getEnv(key, sources) {
  return process.env[key] ?? sources.local[key] ?? sources.template[key] ?? '';
}

async function checkHealth(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { raw: text };
    }
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return { ok: false, status: 0, body: { error: error instanceof Error ? error.message : String(error) } };
  }
}

function section(title) {
  console.log(`\n== ${title} ==`);
}

function normalizeBaseUrl(url) {
  if (!url) return '';
  return String(url).trim().replace(/\/+$/, '');
}

function printFixHints({
  missingEnvKeys,
  prismaFailed,
  baseUrl,
  healthFailed,
  skipHealth,
}) {
  section('Fix Hints');
  if (missingEnvKeys.length > 0) {
    console.log('Missing backend env keys:');
    for (const key of missingEnvKeys) {
      console.log(`- ${key}`);
    }
    console.log('\nQuick patch (shell export):');
    for (const key of missingEnvKeys) {
      console.log(`export ${key}="REPLACE_ME"`);
    }
    console.log('\nPreferred source files: deployment secret manager / .env.local for local checks.');
  }

  if (prismaFailed) {
    console.log('\nPrisma drift remediation:');
    console.log('- Dev: npx prisma migrate dev');
    console.log('- Prod: npx prisma migrate deploy');
  }

  if (healthFailed && !skipHealth) {
    console.log('\nHealth check remediation:');
    console.log(`- Verify base URL is reachable: ${baseUrl || '(missing)'}`);
    console.log('- Optionally override target: RELEASE_CHECK_BASE_URL=https://www.insiderflow.asia npm run release:check');
    console.log('- For local dry checks only: npm run release:check:local');
  }

  console.log('\nExtended hints for mobile envs:');
  console.log('- Run: cd ../../Base44UXUI/mindful-trade-signal-flow && npm run release:check -- --fix-hints');
}

async function run() {
  const envSources = {
    local: parseEnvFile(path.join(projectRoot, '.env.local')),
    template: parseEnvFile(path.join(projectRoot, '.env.template')),
  };
  const failures = [];
  const warnings = [];
  const missingEnvKeys = [];
  let prismaFailed = false;
  let healthFailed = false;

  const requiredEnv = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'INTERNAL_JOBS_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'REVENUECAT_SECRET_API_KEY',
    'REVENUECAT_WEBHOOK_AUTH',
    'REVENUECAT_WEBHOOK_SECRET',
  ];
  const recommendedEnv = [
    'SUBSCRIPTION_ALERT_WEBHOOK_URL',
  ];

  section('Backend Env Checks');
  if (localRelaxedEnvMode) {
    console.log('INFO local dry-run mode: missing required envs are reported as WARN (CI remains strict)');
  }
  for (const key of requiredEnv) {
    const value = getEnv(key, envSources);
    if (isPlaceholder(value)) {
      const issue = `Missing required env: ${key}`;
      if (localRelaxedEnvMode) {
        console.log(`WARN ${key}`);
        warnings.push(`${issue} (local dry-run mode)`);
      } else {
        console.log(`FAIL ${key}`);
        failures.push(issue);
      }
      missingEnvKeys.push(key);
      continue;
    }
    console.log(`PASS ${key}`);
  }
  for (const key of recommendedEnv) {
    const value = getEnv(key, envSources);
    if (isPlaceholder(value)) {
      warnings.push(`Recommended env missing: ${key} (subscription alert notifications disabled)`);
      console.log(`WARN ${key} not set`);
    } else {
      console.log(`PASS ${key}`);
    }
  }

  section('Prisma Migration Drift Check');
  if (skipPrismaFlag) {
    console.log('SKIP prisma migration check (explicit opt-in)');
    warnings.push('Prisma migration check skipped via --skip-prisma or RELEASE_CHECK_SKIP_PRISMA=1');
  } else {
    const migrateStatus = runCommand('npx', ['prisma', 'migrate', 'status', '--schema', 'prisma/schema.prisma'], {
      cwd: projectRoot,
      env: { DATABASE_URL: getEnv('DATABASE_URL', envSources) },
    });
    if (migrateStatus.status !== 0) {
      prismaFailed = true;
      failures.push('Prisma migration status failed (database drift or connectivity issue)');
      console.log('FAIL prisma migrate status');
      if (migrateStatus.stdout) console.log(migrateStatus.stdout.trim());
      if (migrateStatus.stderr) console.log(migrateStatus.stderr.trim());
    } else {
      console.log('PASS prisma migrate status');
    }
  }

  section('Backend Health Checks');
  const baseUrlOverride = normalizeBaseUrl(process.env.RELEASE_CHECK_BASE_URL);
  const configuredBaseUrl = normalizeBaseUrl(getEnv('NEXT_PUBLIC_BASE_URL', envSources) || getEnv('NEXTAUTH_URL', envSources));
  const baseUrl = baseUrlOverride || configuredBaseUrl;

  if (skipHealthFlag) {
    console.log('SKIP health checks (explicit opt-in)');
    warnings.push('Health checks skipped via --skip-health or RELEASE_CHECK_SKIP_HEALTH=1');
  } else if (!baseUrl) {
    healthFailed = true;
    failures.push('Missing NEXT_PUBLIC_BASE_URL/NEXTAUTH_URL (or RELEASE_CHECK_BASE_URL) for health checks');
    console.log('FAIL base URL missing');
  } else {
    if (baseUrlOverride) {
      console.log(`INFO using RELEASE_CHECK_BASE_URL=${baseUrl}`);
    }

    const rcHealth = await checkHealth(`${baseUrl}/api/revenuecat/webhook`);
    if (!rcHealth.ok || rcHealth.body?.ok !== true) {
      healthFailed = true;
      failures.push(`RevenueCat webhook health failed (status ${rcHealth.status})`);
      console.log(`FAIL revenuecat webhook health status=${rcHealth.status}`);
    } else {
      console.log('PASS revenuecat webhook health');
    }

    const internalSecret = getEnv('INTERNAL_JOBS_SECRET', envSources);
    const jobHealth = await checkHealth(`${baseUrl}/api/internal/jobs/subscription-events`, {
      headers: {
        authorization: `Bearer ${internalSecret}`,
      },
    });
    if (!jobHealth.ok || jobHealth.body?.ok !== true) {
      healthFailed = true;
      failures.push(`Internal jobs health failed (status ${jobHealth.status})`);
      console.log(`FAIL internal jobs health status=${jobHealth.status}`);
    } else {
      console.log('PASS internal jobs health');
    }

    const alertJobHealth = await checkHealth(`${baseUrl}/api/internal/jobs/subscription-events/alerts`, {
      headers: {
        authorization: `Bearer ${internalSecret}`,
      },
    });
    if (!alertJobHealth.ok || alertJobHealth.body?.ok !== true) {
      healthFailed = true;
      failures.push(`Internal subscription alerts health failed (status ${alertJobHealth.status})`);
      console.log(`FAIL internal subscription alerts health status=${alertJobHealth.status}`);
    } else {
      console.log('PASS internal subscription alerts health');
    }
  }

  section('Mobile Frontend Release Checks');
  if (skipFrontendCheckFlag) {
    console.log('SKIP mobile frontend check (explicit opt-in)');
    warnings.push('Frontend release check skipped via --skip-frontend-check or RELEASE_CHECK_SKIP_FRONTEND=1');
  } else {
    const frontendArgs = ['run', 'release:check'];
    const frontendForwardArgs = [];
    if (dryRun) frontendForwardArgs.push('--dry-run');
    if (showFixHints) frontendForwardArgs.push('--fix-hints');
    if (frontendForwardArgs.length > 0) {
      frontendArgs.push('--', ...frontendForwardArgs);
    }
    const frontendReleaseScript = runCommand('npm', frontendArgs, {
      cwd: frontendRoot,
    });
    process.stdout.write(frontendReleaseScript.stdout || '');
    process.stderr.write(frontendReleaseScript.stderr || '');
    if (frontendReleaseScript.status !== 0) {
      failures.push('Mobile frontend release check failed');
      console.log('FAIL mobile frontend release check');
    } else {
      console.log('PASS mobile frontend release check');
    }
  }

  if (warnings.length > 0) {
    section('Warnings');
    warnings.forEach((warning) => console.log(`WARN ${warning}`));
  }

  section('Summary');
  if (failures.length === 0) {
    console.log('PASS release checks');
    return;
  }

  failures.forEach((failure) => console.log(`FAIL ${failure}`));
  if (showFixHints) {
    printFixHints({
      missingEnvKeys,
      prismaFailed,
      baseUrl,
      healthFailed,
      skipHealth: skipHealthFlag,
    });
  }
  if (dryRun) {
    console.log('DRY RUN enabled: failures reported but exit code forced to 0');
    return;
  }
  process.exitCode = 1;
}

run();
