import { pruneOldReadAlerts, syncAllUserAlerts } from '@/lib/alerts';
import { releaseAlertsSyncLock, tryAcquireAlertsSyncLock } from '@/lib/alertsSyncLock';

type AlertsSyncJobResult = {
  syncedUsers: number;
  seatAlignmentInserted: number;
  deletedOldReadAlerts: number;
  elapsedMs: number;
  retentionCutoff: string;
};

export type AlertsSyncJobState = {
  inProgress: boolean;
  lastRunAt: string | null;
  lastResult: AlertsSyncJobResult | null;
  lastError: string | null;
};

const globalState = globalThis as unknown as { alertsSyncJobState?: AlertsSyncJobState };

export function getAlertsSyncState(): AlertsSyncJobState {
  if (!globalState.alertsSyncJobState) {
    globalState.alertsSyncJobState = {
      inProgress: false,
      lastRunAt: null,
      lastResult: null,
      lastError: null,
    };
  }
  return globalState.alertsSyncJobState;
}

export async function runAlertsSyncJob() {
  const state = getAlertsSyncState();
  if (state.inProgress) {
    return { skipped: true as const, reason: 'alerts sync already in progress' };
  }

  const lockAcquired = await tryAcquireAlertsSyncLock();
  if (!lockAcquired) {
    return { skipped: true as const, reason: 'alerts sync already in progress' };
  }

  state.inProgress = true;
  state.lastError = null;

  try {
    const startedAt = Date.now();
    const sync = await syncAllUserAlerts();
    const prune = await pruneOldReadAlerts();
    const elapsedMs = Date.now() - startedAt;

    state.lastRunAt = new Date().toISOString();
    state.lastResult = {
      syncedUsers: sync.syncedUsers,
      seatAlignmentInserted: sync.seatAlignmentInserted ?? 0,
      deletedOldReadAlerts: prune.deletedAlerts,
      elapsedMs,
      retentionCutoff: prune.cutoff.toISOString(),
    };
    state.lastError = null;

    return { skipped: false as const, state };
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    state.inProgress = false;
    try {
      await releaseAlertsSyncLock();
    } catch (unlockError) {
      // Keep job responses stable even if lock release logging fails.
      console.error('alerts sync unlock error', unlockError);
    }
  }
}
