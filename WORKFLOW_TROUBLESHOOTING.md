# Subscription Incident Runbook

This runbook covers production subscription pipeline failures for:

- Stripe webhooks
- RevenueCat webhooks/sync
- Internal replay scheduler
- Internal alert scheduler

All commands are non-destructive unless explicitly marked.

## 0) Required credentials

```bash
export BASE_URL="https://www.insiderflow.asia"
export ADMIN_TOKEN="replace-with-admin-token"
export INTERNAL_JOBS_SECRET="replace-with-internal-jobs-secret"
```

## 1) Health + auth sanity

```bash
curl -sS -i "$BASE_URL/api/internal/jobs/subscription-events" \
  -H "authorization: Bearer $INTERNAL_JOBS_SECRET"

curl -sS -i "$BASE_URL/api/internal/jobs/subscription-events/alerts" \
  -H "authorization: Bearer $INTERNAL_JOBS_SECRET"
```

Expected:

- `200` = endpoint reachable + auth correct
- `401` = auth mismatch
- `404` = wrong service URL or old deploy

## 2) Inspect failed/dead-letter events

```bash
# Failed only
curl -sS "$BASE_URL/api/admin/jobs/subscription-events?status=failed&limit=50" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq

# Dead-letter only
curl -sS "$BASE_URL/api/admin/jobs/subscription-events?status=dead_lettered&limit=50" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq

# Aggregate metrics
curl -sS "$BASE_URL/api/admin/jobs/subscription-events/metrics" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq

# Ops status + alert history
curl -sS "$BASE_URL/api/admin/jobs/subscription-events/ops-status?limit=20" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq
```

## 3) Trigger safe auto replay (failed only)

```bash
curl -sS -X POST "$BASE_URL/api/internal/jobs/subscription-events" \
  -H "authorization: Bearer $INTERNAL_JOBS_SECRET" \
  -H "content-type: application/json" \
  -d '{"limit":20}'
```

Optional provider-scoped replay:

```bash
curl -sS -X POST "$BASE_URL/api/internal/jobs/subscription-events" \
  -H "authorization: Bearer $INTERNAL_JOBS_SECRET" \
  -H "content-type: application/json" \
  -d '{"provider":"stripe","limit":20}'
```

## 4) Manual replay from admin API

```bash
# Manual replay (failed only by default)
curl -sS -X POST "$BASE_URL/api/admin/jobs/subscription-events" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"status":"failed","limit":20}'

# Replay dead-lettered explicitly (manual only)
curl -sS -X POST "$BASE_URL/api/admin/jobs/subscription-events" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"status":"dead_lettered","limit":20}'
```

## 5) Alert pipeline validation

```bash
# Evaluate current threshold-based alerts (no test signal)
curl -sS "$BASE_URL/api/admin/jobs/subscription-events/alerts" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq

# Dispatch current threshold-based alerts
curl -sS -X POST "$BASE_URL/api/admin/jobs/subscription-events/alerts" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"notify":true}' | jq

# Force one test alert dispatch (bypasses cooldown)
curl -sS -X POST "$BASE_URL/api/admin/jobs/subscription-events/alerts" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"test":true,"notify":true}' | jq
```

## 6) RevenueCat targeted sync

```bash
curl -sS -X POST "$BASE_URL/api/dev/revenuecat-sync" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "content-type: application/json" \
  -d '{"userId":"<target-user-id>"}' | jq
```

## 7) Decision matrix

- `404` on internal endpoints: wrong service URL or stale deploy.
- `401` on internal endpoints: `INTERNAL_JOBS_SECRET` mismatch between caller and backend.
- growing `due_now_count` + stale `latest_processed_at`: scheduler failing or replay logic blocked.
- growing dead-letter rate: webhook/provider failures; inspect latest event errors and run targeted replay.

## 8) Post-incident checklist

- Confirm `Subscription Internal Jobs` workflow is green for last 3 runs.
- Confirm metrics trend returns to baseline:
  - `due_now_count` decreases
  - `dead_letter_rate` stabilizes
  - `latest_processed_at` recent
- Confirm no auth drift:
  - GitHub `INTERNAL_JOBS_SECRET`
  - Render `INTERNAL_JOBS_SECRET`
  - same exact value
# GitHub Actions Workflow Troubleshooting

## Issue: Workflows Not Running

If your workflows show "0 workflow runs" in GitHub Actions, here's how to fix it:

### 1. Enable GitHub Actions (if disabled)
- Go to your repository → Settings → Actions → General
- Under "Actions permissions", ensure "Allow all actions and reusable workflows" is selected
- Under "Workflow permissions", ensure "Read and write permissions" is selected (for precalculate workflow that commits)

### 2. Verify Workflows Are on Default Branch
- Workflows must be on the default branch (usually `main` or `master`)
- Check: `git branch --show-current` should show your default branch
- If workflows are on a different branch, merge them to main

### 3. Trigger Workflows Manually
- Go to repository → Actions tab
- Click on the workflow name (e.g., "Daily Newsletter")
- Click "Run workflow" button (top right)
- Select branch: `main`
- Click "Run workflow" to trigger immediately

### 4. Check Workflow Syntax
- Workflows must be valid YAML
- Files must be in `.github/workflows/` directory
- File extension must be `.yml` or `.yaml`

### 5. Verify Scheduled Runs
- Scheduled workflows run based on UTC time
- Daily Newsletter: 1am UTC (9am HKT)
- Pre-calculate Portfolio: 2am UTC (10am HKT)
- Note: GitHub Actions may delay scheduled runs by a few minutes

### 6. Check Required Secrets
Ensure these secrets are set in repository settings:
- `DATABASE_URL`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL` (or `NEWSLETTER_FROM_EMAIL`)
- `NEWSLETTER_FROM_NAME` (optional)
- `NEWSLETTER_CTA_URL` (optional)

### 7. Test Workflows Locally
You can test the scripts locally:
```bash
cd web
node scripts/send-daily-newsletter.js your-email@example.com
node scripts/precalculate-portfolio-data.js
```

### 8. Monitor Workflow Runs
- Go to Actions tab to see all workflow runs
- Click on a run to see detailed logs
- Check for errors in the logs

## Current Workflows

1. **Daily Newsletter** (`.github/workflows/daily-newsletter.yml`)
   - Runs: Daily at 9am HKT (1am UTC)
   - Sends newsletter to all paid members

2. **Pre-calculate Portfolio** (`.github/workflows/precalculate-portfolio.yml`)
   - Runs: Daily at 10am HKT (2am UTC)
   - Updates portfolio cache file

3. **Daily Scrape** (`.github/workflows/daily-scrape.yml`)
   - Runs: Multiple times daily
   - Scrapes trade data

## If Workflows Still Don't Run

1. Check repository settings → Actions → General
2. Verify you have admin access to the repository
3. Check if your GitHub plan allows Actions (free tier has limits)
4. Look for any error messages in the Actions tab
5. Try creating a simple test workflow to verify Actions is enabled



