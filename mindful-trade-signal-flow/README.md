# Insider Flow — Vite client

Mobile-first React UI (Vite + React Router). Source of truth in this monorepo: `insider-flow/mindful-trade-signal-flow/`.

## Setup

```bash
cd mindful-trade-signal-flow
npm install
cp .env.example .env.local
# Set VITE_BACKEND_ORIGIN to your local Next port if not 3000, e.g. http://localhost:3005
npm run dev
```

`USE_MOCK` in `src/lib/api/index.js` is **off**; API calls go through the Vite dev proxy to the Next app.

## Environment

| Variable | Purpose |
| --- | --- |
| `VITE_AUTH_TRANSPORT` | `web` (cookie) or `mobile` (bearer + refresh) |
| `VITE_API_BASE_URL` | Usually empty; use full API origin for direct CORS calls |
| `VITE_BACKEND_ORIGIN` | Dev proxy target for `/api` (e.g. `http://localhost:3005`) |

## Production (Render)

Your **Next API** already runs on **Render** (`web/`, e.g. `insiderflow/insider-flow` -> build `cd web && ...`) with the public site on **`https://www.insiderflow.asia`**.

This **Vite** app is separate: build output is **`dist/`**. To host it on **Render** too, create a **Static Site** in the same Render account: connect the same GitHub repo, set **root directory** to `mindful-trade-signal-flow`, **build command** `npm install && npm run build`, **publish directory** `dist`. In that static site’s **Environment**, set:

- **`VITE_API_BASE_URL`** = `https://www.insiderflow.asia` (your Next public URL, no trailing slash) if the static URL is on another hostname; leave empty only if you later put the SPA behind the same origin as the API.
- **`VITE_AUTH_TRANSPORT`** = `web` or `mobile` as you use locally.

On the **web (Next) Render service**, add the static site’s origin to **`CORS_ALLOWED_ORIGINS`** (comma-separated). That’s already implemented in `web/src/middleware.ts`.

**Password reset emails** are built by Next; see `web/.env.template` / `NEXT_PUBLIC_BASE_URL`.

## Housekeeping

Mirror copy also exists at:

- `/Users/kenyeung/Documents/Insider Flow/Base44UXUI/mindful-trade-signal-flow`

From repo root (`insider-flow`), run:

```bash
npm run check:mirror
```

If drift is detected, sync mirror back to source with the command printed by the checker.
