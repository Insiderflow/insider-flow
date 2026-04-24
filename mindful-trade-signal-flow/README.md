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

## Production

Build with `npm run build`; deploy the `dist/` folder. **Vercel:** connect the repo with root directory `mindful-trade-signal-flow` (or import this folder); `vercel.json` is included. Set **`VITE_API_BASE_URL`** to your public API origin (e.g. `https://www.insiderflow.asia`) so the browser calls the API cross-origin. The Next server must list that static origin in **`CORS_ALLOWED_ORIGINS`** (already supported in `web` middleware).

**Password reset emails** use Next’s `NEXT_PUBLIC_BASE_URL` (see `web/.env.template`).
