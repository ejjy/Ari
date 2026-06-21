/**
 * syncEngine — flushes the local store's pending writes to the server
 * (Sprint 2, Commit 4). Builds on localStore's getPending/markSynced/
 * markFailed/removeRow. See docs/sprint-2-offline-sync-design.md.
 *
 * Triggers (D8 — no NetInfo, to keep the sprint OTA-able; NetInfo is a native
 * module and D7 deliberately avoided native deps):
 *   - app foreground (AppState 'active') — JS-only, no native module
 *   - a 60s safety interval while foregrounded
 *   - an exponential-backoff retry while pending work remains
 *   - plus the per-write opportunistic flush DataContext already does inline
 * Online-ness is detected implicitly: a write either succeeds or it doesn't.
 *
 * Single-flight: only one flush runs at a time. Rows go oldest-first so a
 * create always precedes its later update/delete. Because the backend upserts
 * on the client id and DELETE is idempotent, a row sent twice (e.g. the inline
 * live flush racing this one) lands exactly once — no dedupe needed here.
 */
import { AppState, type AppStateStatus } from 'react-native';
import { localStore } from './localStore';
import * as txnApi from '../api/transactions';
import { ApiError } from '../api/client';
import type { Transaction } from '../types';

const SAFETY_INTERVAL_MS = 60_000;
const BASE_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 300_000; // 5 min ceiling
const GIVE_UP_AFTER = 6; // stop auto-retrying a row that keeps failing (likely a 4xx)

let flushing = false;

/**
 * One flush pass. Single-flight. Returns whether any local row changed state
 * (so the caller can refresh the UI). Never throws — failures are recorded on
 * the row and the pass stops/continues per error class.
 */
export async function flushPending(): Promise<{ changed: boolean }> {
  if (flushing) return { changed: false };
  flushing = true;
  let changed = false;
  try {
    const pending = await localStore.getPending();
    for (const r of pending) {
      // A row that has failed repeatedly is almost certainly a permanent
      // (4xx) error — stop hammering it; it stays visible as 'failed'.
      if (r.syncStatus === 'failed' && r.retryCount >= GIVE_UP_AFTER) continue;

      try {
        if (r.op === 'delete') {
          await txnApi.deleteTransaction(r.id);
          await localStore.removeRow(r.id);
        } else if (r.op === 'update') {
          // LWW: send the baseline the client edited from. If the server has
          // moved past it (another device / concurrent edit) it returns 409 +
          // the current row. Server wins: overwrite local with the server's
          // version and mark synced — no infinite retry.
          try {
            const server = await txnApi.updateTransaction(r.id, {
              type: r.type,
              amount: r.amount,
              category: r.category ?? 'uncategorized',
              description: r.description,
              note: r.note,
              date: r.date,
              updatedAt: r.updatedAt,
            });
            await localStore.markSynced(r.id, {
              updatedAt: (server as Transaction & { updatedAt?: string }).updatedAt,
              userId: server.userId,
            });
          } catch (conflictErr) {
            if (conflictErr instanceof ApiError && conflictErr.status === 409) {
              // Server wins — reconcile to its version and mark synced.
              const body = conflictErr.body as { current?: Transaction } | undefined;
              const current = body?.current;
              if (current) {
                await localStore.markSynced(r.id, {
                  updatedAt: (current as Transaction & { updatedAt?: string }).updatedAt,
                  userId: current.userId,
                });
                await localStore.update(r.id, {
                  type: current.type,
                  amount: current.amount,
                  category: current.category,
                  description: current.description,
                  note: current.note,
                  date: current.date,
                });
                // Re-mark synced — update() re-pends it.
                await localStore.markSynced(r.id);
              } else {
                await localStore.markSynced(r.id);
              }
            } else {
              throw conflictErr; // re-raise for the outer catch
            }
          }
        } else {
          // op === 'create'
          const server = await txnApi.addTransaction({
            id: r.id,
            type: r.type,
            amount: r.amount,
            category: r.category ?? 'uncategorized',
            description: r.description,
            note: r.note,
            date: r.date,
            parseSource: r.parseSource === 'aa' ? undefined : r.parseSource,
            confidence: r.confidence ?? undefined,
            merchant: r.merchant,
            rawInput: r.rawInput ?? undefined,
            entryType: r.entryType,
            suppressAlerts: true, // backlog — don't fire stale budget pushes (G7)
          });
          await localStore.markSynced(r.id, {
            updatedAt: (server as Transaction & { updatedAt?: string }).updatedAt,
            userId: server.userId,
          });
        }
        changed = true;
      } catch (err) {
        const status = err instanceof ApiError ? err.status : 0;
        await localStore.markFailed(r.id, err instanceof Error ? err.message : 'sync failed');
        changed = true; // status flip is a change worth reflecting
        if (status >= 400 && status < 500) {
          // Validation error on this row — skip it, keep draining the rest.
          continue;
        }
        // Network / 5xx — stop the pass; a later trigger/backoff retries.
        break;
      }
    }
  } finally {
    flushing = false;
  }
  return { changed };
}

/**
 * Wire up the recurring triggers. Calls onChange() whenever a flush mutated
 * local state. Returns a cleanup to tear everything down. Safe to start once
 * at app level (DataContext).
 */
export function startAutoFlush(onChange: () => void): () => void {
  let stopped = false;
  let failureStreak = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const run = async () => {
    if (stopped) return;
    const { changed } = await flushPending();
    if (changed) onChange();

    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (stopped) return;

    // If work remains, schedule an exponential-backoff retry with jitter so a
    // fleet of clients reconnecting at once doesn't thunder the server.
    const remaining = (await localStore.getPending()).filter(
      (r) => !(r.syncStatus === 'failed' && r.retryCount >= GIVE_UP_AFTER)
    ).length;
    if (remaining > 0) {
      failureStreak = Math.min(failureStreak + 1, 8);
      const base = Math.min(BASE_BACKOFF_MS * 2 ** (failureStreak - 1), MAX_BACKOFF_MS);
      const jitter = base * 0.2 * Math.random();
      retryTimer = setTimeout(() => void run(), base + jitter);
    } else {
      failureStreak = 0;
    }
  };

  const onAppState = (s: AppStateStatus) => {
    if (s === 'active') void run();
  };
  const sub = AppState.addEventListener('change', onAppState);
  const interval = setInterval(() => void run(), SAFETY_INTERVAL_MS);
  void run(); // initial drain

  return () => {
    stopped = true;
    sub.remove();
    clearInterval(interval);
    if (retryTimer) clearTimeout(retryTimer);
  };
}
