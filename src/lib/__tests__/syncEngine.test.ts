/**
 * Sync engine flush logic (Sprint 2, Commit 4). Drives flushPending over the
 * real localStore (stateful AsyncStorage mock) with a mocked transactions API,
 * covering: a pending create syncs and leaves the queue empty; a tombstone
 * delete is sent and removed; a network failure marks the row failed and keeps
 * it pending. Backlog creates must go up with suppressAlerts (G7).
 */
import { localStore } from '../localStore';
import { flushPending } from '../syncEngine';
import * as txnApi from '../../api/transactions';
import { ApiError } from '../../api/client';

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
    },
  };
});

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `uuid-${++n}`) };
});

jest.mock('../../api/transactions', () => ({
  addTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  getTransactions: jest.fn(),
}));

const input = {
  type: 'expense' as const,
  amount: 100,
  category: 'food',
  description: 'test',
  note: '',
  date: '2026-06-18',
};

beforeEach(async () => {
  await localStore.clear();
  jest.clearAllMocks();
});

describe('syncEngine.flushPending', () => {
  it('syncs a pending create (with suppressAlerts) and empties the queue', async () => {
    const rec = await localStore.create(input);
    (txnApi.addTransaction as jest.Mock).mockResolvedValue({
      id: rec.id,
      userId: 'u1',
      updatedAt: '2026-06-18T10:00:00Z',
    });

    const { changed } = await flushPending();

    expect(changed).toBe(true);
    expect(txnApi.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ id: rec.id, suppressAlerts: true })
    );
    expect(await localStore.getPending()).toHaveLength(0);
  });

  it('sends a tombstone delete and removes the row', async () => {
    const rec = await localStore.create(input);
    await localStore.markSynced(rec.id);
    await localStore.softDelete(rec.id);
    (txnApi.deleteTransaction as jest.Mock).mockResolvedValue({ message: 'ok' });

    await flushPending();

    expect(txnApi.deleteTransaction).toHaveBeenCalledWith(rec.id);
    expect(await localStore.getPending()).toHaveLength(0);
  });

  it('marks a row failed and keeps it pending on a network error', async () => {
    await localStore.create(input);
    (txnApi.addTransaction as jest.Mock).mockRejectedValue(new Error('network down'));

    const { changed } = await flushPending();

    expect(changed).toBe(true);
    const pending = await localStore.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].syncStatus).toBe('failed');
    expect(pending[0].retryCount).toBe(1);
  });

  it('is a no-op when there is nothing pending', async () => {
    const { changed } = await flushPending();
    expect(changed).toBe(false);
    expect(txnApi.addTransaction).not.toHaveBeenCalled();
  });

  it('flushes a pending update via PUT and marks it synced', async () => {
    const rec = await localStore.create(input);
    await localStore.markSynced(rec.id, { updatedAt: '2026-06-18T10:00:00Z', userId: 'u1' });
    await localStore.update(rec.id, { amount: 200 });

    (txnApi.updateTransaction as jest.Mock).mockResolvedValue({
      id: rec.id,
      userId: 'u1',
      updatedAt: '2026-06-18T11:00:00Z',
    });

    const { changed } = await flushPending();

    expect(changed).toBe(true);
    expect(txnApi.updateTransaction).toHaveBeenCalledWith(
      rec.id,
      expect.objectContaining({ amount: 200 })
    );
    expect(await localStore.getPending()).toHaveLength(0);
  });

  it('server-wins on 409 conflict: overwrites local and marks synced', async () => {
    const rec = await localStore.create(input);
    await localStore.markSynced(rec.id, { updatedAt: '2026-06-18T09:00:00Z', userId: 'u1' });
    await localStore.update(rec.id, { amount: 999 });

    const conflict = new ApiError(409, 'Conflict');
    (conflict as ApiError & { body: unknown }).body = {
      conflict: true,
      current: { id: rec.id, amount: 777, category: 'food', description: 'test', note: '', date: '2026-06-18', type: 'expense', userId: 'u1', updatedAt: '2026-06-18T12:00:00Z', month: '2026-06', createdAt: '2026-06-18T09:00:00Z' },
    };
    (txnApi.updateTransaction as jest.Mock).mockRejectedValue(conflict);

    const { changed } = await flushPending();

    expect(changed).toBe(true);
    expect(await localStore.getPending()).toHaveLength(0);
    const all = await localStore.getAll();
    const row = all.find((t) => t.id === rec.id);
    expect(row?.amount).toBe(777);
    expect(row?.syncStatus).toBe('synced');
  });
});
