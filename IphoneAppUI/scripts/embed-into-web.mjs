#!/usr/bin/env node
/**
 * Copy Vite dist → insider-flow/web/public/app for same-origin deploy at /app/
 * Run: npm run build:embed (from IphoneAppUI)
 */
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
// In monorepo: IphoneAppUI/ and web/ are siblings under insider-flow/
const target = join(root, "..", "web", "public", "app");

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(dist, target, { recursive: true });
console.log(`Embedded mobile UI → ${target}`);
