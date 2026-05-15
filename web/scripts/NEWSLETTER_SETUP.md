# Daily Newsletter Setup Guide

## Overview
The daily newsletter automatically sends new trades to all active paid members every day at 9am HKT (1am UTC).

## Components

### 1. Newsletter Script
**Location:** `scripts/send-daily-newsletter.js`

**Features:**
- Fetches trades from the current day (HKT timezone)
- Filters for active paid members (membership_tier = 'PAID' and not expired)
- Sends emails in batches to respect SendGrid rate limits (50 emails/second)
- Includes error handling and retry logic

**Usage:**
```bash
# From machine: use repo-relative path (not Documents/Insider Flow/web)
cd insider-flow/web

# Test mode (send to single email)
node scripts/send-daily-newsletter.js your-email@example.com

# Production mode (send to all paid members)
node scripts/send-daily-newsletter.js
```

### 2. GitHub Actions Workflow
**Location:** `.github/workflows/daily-newsletter.yml`

**Schedule:** Runs daily at 9am HKT (1am UTC)

**Manual Trigger:** You can also trigger it manually from GitHub Actions tab

## Setup Instructions

### 1. Required Environment Variables
Add these secrets to your GitHub repository:

- `DATABASE_URL` - Your PostgreSQL connection string
- `SENDGRID_API_KEY` - Your SendGrid API key
- `NEWSLETTER_FROM_EMAIL` (optional) - Default: `team@insiderflow.asia`
- `NEWSLETTER_FROM_NAME` (optional) - Default: `Insider Flow`
- `NEWSLETTER_CTA_URL` (optional) - Default: `https://insiderflow.asia`

### 2. SendGrid Setup
1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key with "Mail Send" permissions
3. Verify your sender email address
4. Add the API key to GitHub secrets

### 3. Testing
Before going live, test the newsletter:

```bash
# Set environment variables locally
export DATABASE_URL="your-database-url"
export SENDGRID_API_KEY="your-sendgrid-key"

# Test with your email
node scripts/send-daily-newsletter.js your-email@example.com
```

### 4. Monitoring
- Check GitHub Actions logs for delivery status
- Monitor SendGrid dashboard for bounce/complaint rates
- Check database for active paid member count

## How It Works

1. **Trade Selection:** Uses **`Asia/Hong_Kong`** calendar day (via `Intl`, not host `TZ`). Includes a row if **`created_at` OR `published_at`** falls in that `[00:00, 24:00) HKT` UTC window (new inserts plus same-day disclosures on older rows). Re-imports that only touch other fields without moving `published_at` into “today” may still be omitted until we add `Trade.updated_at` again.
2. **Member Filtering:** Finds all users with:
   - `membership_tier = 'PAID'`
   - `membership_expires_at` is null OR in the future
   - Has a valid email address
3. **Email Sending:** 
   - Sends in batches of 50 emails
   - Waits 1 second between batches
   - Falls back to individual sends if batch fails

## Customization

### Change Send Time
Edit `.github/workflows/daily-newsletter.yml`:
```yaml
schedule:
  - cron: '0 1 * * *'  # Change to your desired UTC time
```

### Change Email Template
Edit the `renderHtml()` function in `scripts/send-daily-newsletter.js`

### Change Batch Size
Edit `BATCH_SIZE` and `BATCH_DELAY_MS` constants in the script

## Troubleshooting

### I use Gmail but never get the daily digest
1. **Paid only:** This workflow emails **active PAID** users (`membership_tier = PAID`, expiry in future or null). **Free / registered-only accounts are not on the list.** For free research use [Substack](https://insiderflow.substack.com/).
2. **GitHub secret:** Repo → **Settings → Secrets and variables → Actions** → ensure **`SENDGRID_API_KEY`** is set. If it is missing, the script **dry-runs** (no send); in CI it now **fails the job** so you see red in Actions.
3. **Sender verification:** In SendGrid, **`NEWSLETTER_FROM_EMAIL` / `SENDGRID_FROM_EMAIL`** (e.g. `team@insiderflow.asia`) must be a **verified sender** or Single Sender.
4. **Gmail folder:** Check **Promotions** / **Spam** for subject `【每日內幕交易】`.
5. **Run locally:** `cd web && node scripts/check-newsletter-status.js` then `node scripts/send-daily-newsletter.js your@gmail.com` (sends one test to you if `SENDGRID_API_KEY` is in `.env.local`).

### No emails sent
- Check GitHub Actions logs
- Verify SendGrid API key is correct
- Ensure there are active paid members in database
- Check SendGrid account limits

### Some emails failed
- Check SendGrid logs for bounce/complaint reasons
- Verify email addresses are valid
- Check SendGrid account status

### Wrong trades included
- Confirm `scripts/lib/hkt-day-window.js` bounds in logs vs expected HKT date.
- Compare `check-newsletter-status.js` lines: `created only` vs `published only` vs **digest (OR)**.
- Review the raw SQL `WHERE` in `send-daily-newsletter.js` `main()`.









