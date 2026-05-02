#!/usr/bin/env node
/**
 * Validates .env.production before App Store / Google Play builds (no secrets printed).
 *
 * Usage:
 *   npm run mobile:release-check
 *   npm run mobile:release-check:android   # Play focus
 *   npm run mobile:release-check:ios
 *
 * Flags:
 *   --platform=ios|android|all   (default: all)
 *   --skip-store-keys            RevenueCat empty → WARN instead of FAIL
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function parseArgs(argv) {
  let platform = 'all';
  let skipStoreKeys = false;
  for (const a of argv) {
    if (a === '--skip-store-keys') skipStoreKeys = true;
    if (a.startsWith('--platform=')) {
      const v = a.slice('--platform='.length).toLowerCase();
      if (v === 'ios' || v === 'android' || v === 'all') platform = v;
    }
  }
  return { platform, skipStoreKeys };
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const { platform, skipStoreKeys } = parseArgs(process.argv.slice(2));
const wantIos = platform === 'ios' || platform === 'all';
const wantAndroid = platform === 'android' || platform === 'all';

const androidRoot = path.join(root, 'android');
const androidAppGradle = path.join(androidRoot, 'app', 'build.gradle');
const iosAppDir = path.join(root, 'ios', 'App');

const androidPresent = fs.existsSync(androidRoot) && fs.existsSync(androidAppGradle);
const iosPresent = fs.existsSync(iosAppDir);

const failures = [];
const warnings = [];

const envPath = path.join(root, '.env.production');
if (!fs.existsSync(envPath)) {
  failures.push('Missing .env.production — copy from .env.example / MOBILE_STORE_RELEASE_CHECKLIST.md');
}

const env = parseEnvFile(envPath);

const auth = (env.VITE_AUTH_TRANSPORT || '').toLowerCase();
const api = (env.VITE_API_BASE_URL || '').trim();

if (auth !== 'mobile') {
  failures.push(`VITE_AUTH_TRANSPORT must be "mobile" for store build (got "${auth || 'empty'}")`);
}

if (!/^https:\/\//i.test(api)) {
  failures.push('VITE_API_BASE_URL must be absolute https URL for mobile release');
}

if (/localhost|127\.0\.0\.1|\u2026|%E2%80%A6/i.test(api)) {
  failures.push('VITE_API_BASE_URL must not use localhost or ellipsis placeholder');
}

let runAndroid = wantAndroid && androidPresent;
if (wantAndroid && !androidPresent) {
  if (platform === 'android') {
    failures.push(
      'android/ project not found — run `npx cap add android` or run from the Capacitor app that ships Play builds',
    );
  } else {
    warnings.push(
      'android/ not present — skipping Google Play-specific checks (expected only in full Capacitor trees)',
    );
  }
}

const rcAndroid = (env.VITE_REVENUECAT_API_KEY_ANDROID || '').trim();
const rcIos = (env.VITE_REVENUECAT_API_KEY_IOS || '').trim();
const MIN_RC_LEN = 12;

function billingFail(msg) {
  if (skipStoreKeys) warnings.push(`${msg} (FAIL suppressed by --skip-store-keys)`);
  else failures.push(msg);
}

if (runAndroid) {
  if (!rcAndroid || rcAndroid.length < MIN_RC_LEN) {
    billingFail(
      'Google Play: set VITE_REVENUECAT_API_KEY_ANDROID (public SDK key from RevenueCat) for native subscriptions',
    );
  }

  try {
    const gradle = fs.readFileSync(androidAppGradle, 'utf8');
    const hasSigningConfigs =
      /signingConfigs\s*\{/.test(gradle) &&
      (/storeFile\s+/.test(gradle) || /signingConfig\s+signingConfigs\./.test(gradle));
    if (!hasSigningConfigs) {
      warnings.push(
        'Google Play: no release signingConfigs detected in android/app/build.gradle — configure upload/signing key before shipping .aab',
      );
    }
    if (!fs.existsSync(path.join(androidRoot, 'app', 'google-services.json'))) {
      warnings.push(
        'Google Play: android/app/google-services.json missing — OK if you do not use FCM; required for Firebase push',
      );
    }
  } catch {
    failures.push('Could not read android/app/build.gradle');
  }
}

let runIos = wantIos && iosPresent;
if (wantIos && !iosPresent) {
  if (platform === 'ios') {
    failures.push('ios/App not found — run from the Capacitor project that ships iOS');
  } else {
    warnings.push('ios/App not present — skipping iOS-specific RevenueCat hints');
  }
}

if (runIos) {
  if (!rcIos || rcIos.length < MIN_RC_LEN) {
    billingFail(
      'App Store: set VITE_REVENUECAT_API_KEY_IOS (public SDK key from RevenueCat) for native subscriptions',
    );
  }
  const appleClient = (env.VITE_APPLE_IOS_CLIENT_ID || '').trim();
  if (!appleClient) {
    warnings.push(
      'VITE_APPLE_IOS_CLIENT_ID is empty — Sign in with Apple button is hidden until set (Guideline 4.8)',
    );
  }
}

const summary = {
  phase: 'mobile-release-check',
  platform,
  skipStoreKeys,
  auth: auth || null,
  apiHostSet: Boolean(api),
  android: runAndroid ? 'checked' : wantAndroid ? 'skipped' : 'n/a',
  ios: runIos ? 'checked' : wantIos ? 'skipped' : 'n/a',
};
console.log(JSON.stringify(summary, null, 2));

warnings.forEach((w) => console.warn(`\nWARN: ${w}`));

if (failures.length) {
  console.error('\nFAILURES:');
  failures.forEach((f) => console.error(` - ${f}`));
  process.exit(1);
}

console.log('\nPASS mobile-release-check (.env.production)');
process.exit(0);
