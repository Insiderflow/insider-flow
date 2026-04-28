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

## Optional but recommended

- Restrict who can push directly to protected branches
- Require conversation resolution before merging
- Require signed commits if your team uses commit signing

## Fast verification

After saving branch protection:

1. Open a test PR with a tiny change.
2. Confirm merge is blocked until all required checks are green.
3. Confirm merge is blocked if one required check fails.
