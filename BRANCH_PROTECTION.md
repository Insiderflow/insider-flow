# Branch Protection Checklist

Use this to make CI truly blocking instead of advisory.

## Branches to protect

- `main`
- `master` (only if still used)

## GitHub settings

In `Settings -> Branches -> Branch protection rules`, enable:

- Require a pull request before merging
- Require approvals (recommended: at least 1)
- Dismiss stale approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Do not allow bypassing the above requirements

## Required status checks

Select these exact checks:

- `Release Gate PR / release-gate-local`
- `Release Gate PR / frontend-release-gate`
- `CI / web-build`
- `CI / mindful-trade-build`
- `CI / repo-guard`

## Optional status checks

Add when you want deploy-time verification to block merges:

- `Post Deploy Smoke / production-smoke`

Requires repo Actions secrets `RELEASE_CHECK_BASE_URL` and `INTERNAL_JOBS_SECRET` (same values as production checks).

## Owner-only (cannot be automated here)

Do these in GitHub / hosting dashboards when you have time:

- Confirm Actions secrets exist: `RELEASE_CHECK_BASE_URL`, `INTERNAL_JOBS_SECRET`, plus any Vercel/GitHub integration secrets your deploy uses.
- Open Actions tab after each push and confirm workflows are green (especially `Post Deploy Smoke` after merge to `main`).
- Render: add **`DATABASE_URL_UNPOOLED`** (Neon **direct**, non-pooler URL) and set **Pre-deploy** to  
  `cd web && export DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" && npx prisma migrate deploy`  
  or `cd web && sh scripts/render-migrate-deploy.sh` once that script is in the repo (plain migrate on the pooler → **P1002**). If Render root is already `web`, omit `cd web &&`.
- Merge pending bot PRs (e.g. security/CVE) after checks pass — merge button is yours.
- Optional later: set repo variable `REQUIRE_REVENUECAT_SECRETS=1` when Apple/RevenueCat mobile secrets are all in GitHub.
- Optional: resolve **mirror drift** (`npm run check:mirror`) — two directories intentionally diverged; only sync when you intend to overwrite `mindful-trade-signal-flow` in-repo copy.

## Optional but recommended

- Restrict who can push directly to protected branches
- Require conversation resolution before merging
- Require signed commits if your team uses commit signing

## Fast verification

After saving branch protection:

1. Open a test PR with a tiny change.
2. Confirm merge is blocked until all required checks are green.
3. Confirm merge is blocked if one required check fails.
