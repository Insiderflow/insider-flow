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

Build static assets with `npm run build`; deploy `dist/` to any static host. Set `VITE_API_BASE_URL` to your public Next API origin if the UI is on another domain; configure CORS on the server.

**Password reset emails** are sent by the Next app: set `NEXT_PUBLIC_BASE_URL` on the server to the URL where users can open reset links (your deployed Next or marketing site with `/reset-password` if applicable).
