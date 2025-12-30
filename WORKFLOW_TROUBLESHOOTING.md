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


