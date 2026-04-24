import { prisma } from '@/lib/prisma';

// Stable lock key for alerts sync. PostgreSQL advisory locks are bigint/int64.
const ALERTS_SYNC_LOCK_KEY = BigInt('83820042001');

export async function tryAcquireAlertsSyncLock() {
  const rows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_lock(${ALERTS_SYNC_LOCK_KEY}) AS locked
  `;
  return rows[0]?.locked === true;
}

export async function releaseAlertsSyncLock() {
  await prisma.$queryRaw`
    SELECT pg_advisory_unlock(${ALERTS_SYNC_LOCK_KEY})
  `;
}
