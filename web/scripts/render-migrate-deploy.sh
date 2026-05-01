#!/usr/bin/env sh
# Neon: Prisma Migrate uses session-level advisory locks; they time out (P1002) when DATABASE_URL
# points at the transaction pooler (`-pooler` in the host). For deploy-time migrate, use the
# direct connection string from the Neon dashboard if set; otherwise fall back to DATABASE_URL.
set -e
cd "$(dirname "$0")/.."
export DATABASE_URL="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
exec npx prisma migrate deploy
