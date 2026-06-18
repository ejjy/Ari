/**
 * Offline-first store logic (Sprint 2, Commit 2). These exercise the DoD
 * guarantees that don't need a device: instant local write + pending state,
 * durable persistence (survives an app kill), seed-merge preserving
 * offline-born rows, tombstone deletes, sync transitions, and logout wipe.
 * The server-side no-duplicate guarantee is proven separately by the live
 * backend smoke test (upsert on client id).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Stateful AsyncStorage so persistence is real within a test.
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
      setItem: jest.fn(async (k: string, v: string) => {
        store[k] = v;
      }),
      removeItem: jest.fn(async (k: string) => {
        delete store[k];
      }),
      multiRemove: jest.fn(async (keys: string[]) => {
        keys.forEach((k) => delete store[k]);
      }),
      __dump: () => store,
    },
  };
});

// Deterministic, unique client ids.
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `uuid-${++n}`) };
});

import { localStore } from '../localStore';
import type { Transaction } from '../../types';

const STORE_KEY = 'ari_txn_store_v1';

function input(over: Partial<Parameters<typeof localStore.create>[0]> = {}) {
  return {
    type: 'expense' as const,
    amount: 100,
    category: 'food',
    description: 'test',
    note: '',
    date: '2026-06-18',
    ...over,
  };
}

beforeEach(async () => {
  await localStore.clear(); // resets the module cache + the mock store
  jest.clearAllMocks();
});

describe('localStore — offline write + pending state', () => {
  it('creates rows instantly, all marked pending, newest first', async () => {
    await localStore.create(input({ amount: 10, date: '2026-06-16' }));
    await localStore.create(input({ amount: 20, date: '2026-06-17' }));
    await localStore.create(input({ amount: 30, date: '2026-06-18' }));

    const all = await localStore.getAll();
    expect(all).toHaveLength(3);
    expect(all.map((t) => t.amount)).toEqual([30, 20, 10]); // date desc

    const pending = await localStore.getPending();
    expect(pending).toHaveLength(3);
    expect(pending.every((r) => r.syncStatus === 'pending' && r.op === 'create')).toBe(true);
  });

  it('persists to durable storage (survives an app kill)', async () => {
    const rec = await localStore.create(input({ amount: 77 }));
    const raw = (AsyncStorage as unknown as { __dump: () => Record<string, string> }).__dump()[
      STORE_KEY
    ];
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw);
    expect(persisted).toHaveLength(1);
    expect(persisted[0].id).toBe(rec.id);
    expect(persisted[0].amount).toBe(77);
  });
});

describe('localStore — sync transitions', () => {
  it('markSynced removes a row from the pending set but keeps it visible', async () => {
    const rec = await localStore.create(input());
    await localStore.markSynced(rec.id, { updatedAt: '2026-06-18T10:00:00Z', userId: 'u1' });

    expect(await localStore.getPending()).toHaveLength(0);
    const all = await localStore.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].userId).toBe('u1');
  });

  it('markFailed flags the row but keeps it pending-eligible', async () => {
    const rec = await localStore.create(input());
    await localStore.markFailed(rec.id, 'network');
    const pending = await localStore.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].syncStatus).toBe('failed');
    expect(pending[0].retryCount).toBe(1);
  });
});

describe('localStore — delete', () => {
  it('a synced row becomes a hidden pending-delete tombstone', async () => {
    const rec = await localStore.create(input());
    await localStore.markSynced(rec.id);

    await localStore.softDelete(rec.id);
    expect(await localStore.getAll()).toHaveLength(0); // hidden from UI

    const pending = await localStore.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].op).toBe('delete');
    expect(pending[0].deleted).toBe(true);
  });

  it('an unsynced create is dropped outright on delete (nothing to propagate)', async () => {
    const rec = await localStore.create(input());
    await localStore.softDelete(rec.id);
    expect(await localStore.getAll()).toHaveLength(0);
    expect(await localStore.getPending()).toHaveLength(0); // no tombstone needed
  });

  it('removeRow physically drops a tombstone after the server confirms', async () => {
    const rec = await localStore.create(input());
    await localStore.markSynced(rec.id);
    await localStore.softDelete(rec.id);
    await localStore.removeRow(rec.id);
    expect(await localStore.getPending()).toHaveLength(0);
    const raw = (AsyncStorage as unknown as { __dump: () => Record<string, string> }).__dump()[
      STORE_KEY
    ];
    expect(JSON.parse(raw)).toHaveLength(0);
  });
});

describe('localStore — seed merge', () => {
  const serverTxn = (id: string, amount: number): Transaction => ({
    id,
    userId: 'u1',
    amount,
    type: 'expense',
    category: 'food',
    description: 'server',
    note: '',
    date: '2026-06-10',
    month: '2026-06',
    createdAt: '2026-06-10T00:00:00Z',
  });

  it('seeds server history as synced and flips isSeeded', async () => {
    expect(await localStore.isSeeded()).toBe(false);
    await localStore.seed([serverTxn('s1', 1), serverTxn('s2', 2)]);
    expect(await localStore.isSeeded()).toBe(true);
    expect(await localStore.getAll()).toHaveLength(2);
    expect(await localStore.getPending()).toHaveLength(0); // server rows are synced
  });

  it('preserves an offline-born pending create when seeding later', async () => {
    // Fresh install, offline: user logs one entry before any seed.
    const offline = await localStore.create(input({ amount: 999 }));
    // Later, online: seed runs and must not wipe the pending local row.
    await localStore.seed([serverTxn('s1', 1)]);

    const all = await localStore.getAll();
    expect(all.map((t) => t.id).sort()).toEqual([offline.id, 's1'].sort());
    const pending = await localStore.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(offline.id); // still needs to flush
  });
});

describe('localStore — logout', () => {
  it('clear wipes rows and the seeded flag', async () => {
    await localStore.create(input());
    await localStore.seed([]);
    await localStore.clear();
    expect(await localStore.getAll()).toHaveLength(0);
    expect(await localStore.isSeeded()).toBe(false);
  });
});
