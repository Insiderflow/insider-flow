#!/usr/bin/env sh
# Neon: Prisma Migrate uses session-level advisory locks; they time out (P1002) when
# DATABASE_URL points at the transaction pooler (`-pooler` in the host), or when another
# migrate deploy holds the lock (second Render deploy, GitHub neon_workflow, local migrate).
#
# For deploy-time migrate, use the direct connection string from Neon if set:
#   Render env: DATABASE_URL_UNPOOLED = connection string WITHOUT ?pgbouncer=true
# Falls back to DATABASE_URL if unset.
#
# Transient P1002: set optional longer retry window (defaults below).
set -e
cd "$(dirname "$0")/.."
export DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"

# Total wait can be (max-1) * sleep seconds (default 4 * 15s = 60s extra after first failure).
MIGRATE_DEPLOY_MAX_ATTEMPTS="${MIGRATE_DEPLOY_MAX_ATTEMPTS:-5}"
MIGRATE_DEPLOY_RETRY_SECONDS="${MIGRATE_DEPLOY_RETRY_SECONDS:-15}"

attempt=1
while [ "$attempt" -le "$MIGRATE_DEPLOY_MAX_ATTEMPTS" ]; do
  if npx prisma migrate deploy; then
    exit 0
  fi
  exit_code=$?
  if [ "$attempt" -eq "$MIGRATE_DEPLOY_MAX_ATTEMPTS" ]; then
    echo "prisma migrate deploy failed after ${MIGRATE_DEPLOY_MAX_ATTEMPTS} attempt(s) (last exit ${exit_code})."
    echo "If logs show P1002 / advisory lock: another migrate may be running, or use DATABASE_URL_UNPOOLED (Neon direct)."
    echo "Neon console → Connection details → **Direct** connection for DATABASE_URL_UNPOOLED."
    exit "$exit_code"
  fi
  echo "prisma migrate deploy failed (exit ${exit_code}), attempt ${attempt}/${MIGRATE_DEPLOY_MAX_ATTEMPTS} — retrying in ${MIGRATE_DEPLOY_RETRY_SECONDS}s..."
  attempt=$((attempt + 1))
  sleep "$MIGRATE_DEPLOY_RETRY_SECONDS"
done
