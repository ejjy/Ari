/**
 * localStore — offline-first transaction store (Sprint 2, Commit 2).
 *
 * The on-device source of truth for transactions. The UI reads from here, not
 * the network; writes commit here first and return immediately, then a flush
 * reconciles to the server. See docs/sprint-2-offline-sync-design.md.
 *
 * Decision D7: backed by AsyncStorage (already a dependency), not expo-sqlite.
 * For this app's data profile (single-user, ~1MB over years) a load-all +
 * filter-in-JS model is fast and keeps the feature OTA-able with no native
 * module. This file is the ONLY place that knows the backing store, so the
 * sync engine (Commit 4) and DataContext never see through it — swapping to
 * SQLite later is a change confined to this file.
 *
 * Records carry server-invisible sync-control fields (syncStatus/op/deleted/
 * retryCount). `tags`, recurring, incomeSource, accountId and merchantId are
 * intentionally NOT persisted offline this sprint (online-only paths set them).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { Transaction, TransactionType, Category } from '../types';

const STORE_KEY = 'ari_txn_store_v1';
const META_KEY = 'ari_txn_store_meta_v1';

export type SyncStatus = 'synced' | 'pending' | 'failed';
export type SyncOp = 'create' | 'update' | 'delete';

export interface LocalTxn {
  id: string; // client UUID v4 (canonical id — ID model A)
  amount: number; // whole rupees
  type: TransactionType;
  category: string | null; // 'uncategorized' until AI/user sets it (D4)
  description: string;
  note: string;
  date: string; // 'YYYY-MM-DD'
  // parse provenance — kept because the voice/AI entry path stays (D1)
  merchant: string | null;
  entryType: 'manual' | 'voice';
  rawInput: string | null;
  parseSource: 'local' | 'fuzzy' | 'ai' | 'aa';
  confidence: number | null;
  // timestamps
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // server-authoritative once synced (G1)
  // sync control (local only)
  userId: string; // filled from server on sync; '' for offline-born rows
  syncStatus: SyncStatus;
  op: SyncOp;
  deleted: boolean;
  retryCount: number;
  lastError: string | null;
}

export interface CreateInput {
  type: TransactionType;
  amount: number;
  category: string | null;
  description: string;
  note: string;
  date: string;
  merchant?: string | null;
  entryType?: 'manual' | 'voice';
  rawInput?: string | null;
  parseSource?: 'local' | 'fuzzy' | 'ai' | 'aa';
  confidence?: number | null;
}

export interface UpdateInput {
  type?: TransactionType;
  amount?: number;
  category?: string | null;
  description?: string;
  note?: string;
  date?: string;
}

// In-memory cache of the full row set. Loaded once, kept in sync with every
// persist so reads never touch disk after the first.
let cache: LocalTxn[] | null = null;

// Serialize all mutations: AsyncStorage holds the rows as one JSON blob, so two
// concurrent read-modify-write cycles would clobber each other. Every mutation
// runs through this chain; reads do not need it.
let writeChain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function load(): Promise<LocalTxn[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    cache = raw ? (JSON.parse(raw) as LocalTxn[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

async function persist(rows: LocalTxn[]): Promise<void> {
  cache = rows;
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(rows));
}

function nowISO(): string {
  return new Date().toISOString();
}

/** LocalTxn -> the Transaction shape the UI consumes. */
function toTxn(r: LocalTxn): Transaction {
  return {
    id: r.id,
    userId: r.userId,
    amount: r.amount,
    type: r.type,
    category: (r.category ?? 'uncategorized') as Category,
    description: r.description,
    note: r.note,
    date: r.date,
    month: r.date.slice(0, 7),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    syncStatus: r.syncStatus,
  };
}

/** Server Transaction -> a synced LocalTxn (one-time seed / reconcile). */
function fromServer(t: Transaction): LocalTxn {
  const anyT = t as Transaction & {
    merchant?: string | null;
    parseSource?: LocalTxn['parseSource'];
    confidence?: number | null;
    entryType?: string;
    rawInput?: string | null;
    updatedAt?: string;
  };
  return {
    id: t.id,
    amount: t.amount,
    type: t.type,
    category: t.category ?? 'uncategorized',
    description: t.description ?? '',
    note: t.note ?? '',
    date: t.date,
    merchant: anyT.merchant ?? null,
    entryType: anyT.entryType === 'voice' ? 'voice' : 'manual',
    rawInput: anyT.rawInput ?? null,
    parseSource: anyT.parseSource ?? 'local',
    confidence: anyT.confidence ?? null,
    createdAt: t.createdAt,
    updatedAt: anyT.updatedAt ?? t.createdAt,
    userId: t.userId ?? '',
    syncStatus: 'synced',
    op: 'create',
    deleted: false,
    retryCount: 0,
    lastError: null,
  };
}

function sortRows(rows: LocalTxn[]): LocalTxn[] {
  return rows
    .filter((r) => !r.deleted)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.createdAt < b.createdAt ? 1 : -1;
    });
}

export const localStore = {
  /** Non-deleted rows, newest first, in the UI's Transaction shape. */
  async getAll(): Promise<Transaction[]> {
    const rows = await load();
    return sortRows(rows).map(toTxn);
  },

  async isSeeded(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(META_KEY);
      return !!raw && JSON.parse(raw).seeded === true;
    } catch {
      return false;
    }
  },

  /**
   * One-time seed from the server's full history. MERGES by id — server rows
   * not already present are added as `synced`; existing local rows (incl.
   * offline-born pending creates) are preserved. Marks the store seeded.
   */
  async seed(serverTxns: Transaction[]): Promise<void> {
    return withLock(async () => {
      const rows = await load();
      const byId = new Set(rows.map((r) => r.id));
      for (const t of serverTxns) {
        if (!byId.has(t.id)) rows.push(fromServer(t));
      }
      await persist(rows);
      await AsyncStorage.setItem(
        META_KEY,
        JSON.stringify({ seeded: true, lastSyncAt: nowISO() })
      );
    });
  },

  /** Write a new pending create with a client-generated id. Returns the row. */
  async create(input: CreateInput): Promise<LocalTxn> {
    return withLock(async () => {
      const rows = await load();
      const ts = nowISO();
      const record: LocalTxn = {
        id: Crypto.randomUUID(),
        amount: input.amount,
        type: input.type,
        category: input.category ?? 'uncategorized',
        description: input.description,
        note: input.note,
        date: input.date,
        merchant: input.merchant ?? null,
        entryType: input.entryType ?? 'manual',
        rawInput: input.rawInput ?? null,
        parseSource: input.parseSource ?? 'local',
        confidence: input.confidence ?? null,
        createdAt: ts,
        updatedAt: ts,
        userId: '',
        syncStatus: 'pending',
        op: 'create',
        deleted: false,
        retryCount: 0,
        lastError: null,
      };
      rows.push(record);
      await persist(rows);
      return record;
    });
  },

  /**
   * Patch an existing row (edit path). The edit is applied locally and the row
   * is re-queued as a pending update so the sync engine can PUT it. If the row
   * is itself still a pending-create (never reached the server), we just patch
   * it inline — the next create flush will carry the updated fields. Returns
   * the updated Transaction view or null if the id isn't found.
   */
  async update(id: string, patch: UpdateInput): Promise<Transaction | null> {
    return withLock(async () => {
      const rows = await load();
      const r = rows.find((x) => x.id === id && !x.deleted);
      if (!r) return null;
      if (patch.type !== undefined) r.type = patch.type;
      if (patch.amount !== undefined) r.amount = patch.amount;
      if (patch.category !== undefined) r.category = patch.category;
      if (patch.description !== undefined) r.description = patch.description;
      if (patch.note !== undefined) r.note = patch.note;
      if (patch.date !== undefined) r.date = patch.date;
      r.updatedAt = nowISO();
      // A never-synced create just gets re-queued as the same create op with
      // the new fields — the server will see the final state on first flush.
      if (r.syncStatus === 'synced') {
        r.syncStatus = 'pending';
        r.op = 'update';
      }
      r.retryCount = 0;
      r.lastError = null;
      await persist(rows);
      return toTxn(r);
    });
  },

  /**
   * Delete a row. If it never reached the server (a pending create), drop it
   * outright — there's nothing to propagate. Otherwise leave a pending-delete
   * tombstone for the flush to send, with the UI already hiding it.
   */
  async softDelete(id: string): Promise<void> {
    return withLock(async () => {
      const rows = await load();
      const r = rows.find((x) => x.id === id);
      if (!r) return;
      if (r.syncStatus !== 'synced' && r.op === 'create') {
        await persist(rows.filter((x) => x.id !== id));
        return;
      }
      r.op = 'delete';
      r.deleted = true;
      r.syncStatus = 'pending';
      r.updatedAt = nowISO();
      await persist(rows);
    });
  },

  /** Mark a create/update row synced, merging server-authoritative fields. */
  async markSynced(
    id: string,
    server?: { updatedAt?: string; userId?: string }
  ): Promise<void> {
    return withLock(async () => {
      const rows = await load();
      const r = rows.find((x) => x.id === id);
      if (!r) return;
      r.syncStatus = 'synced';
      r.retryCount = 0;
      r.lastError = null;
      if (server?.updatedAt) r.updatedAt = server.updatedAt;
      if (server?.userId) r.userId = server.userId;
      await persist(rows);
    });
  },

  /** Mark a row failed (network/5xx — still retryable; 4xx surfaces it). */
  async markFailed(id: string, error: string): Promise<void> {
    return withLock(async () => {
      const rows = await load();
      const r = rows.find((x) => x.id === id);
      if (!r) return;
      r.syncStatus = 'failed';
      r.retryCount += 1;
      r.lastError = error;
      await persist(rows);
    });
  },

  /** Physically remove a row (after a delete is confirmed on the server). */
  async removeRow(id: string): Promise<void> {
    return withLock(async () => {
      const rows = await load();
      await persist(rows.filter((x) => x.id !== id));
    });
  },

  /** Rows not yet reconciled with the server, oldest first (causal order). */
  async getPending(): Promise<LocalTxn[]> {
    const rows = await load();
    return rows
      .filter((r) => r.syncStatus !== 'synced')
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  },

  /** Wipe everything (called on logout so the next user starts clean). */
  async clear(): Promise<void> {
    return withLock(async () => {
      cache = [];
      await AsyncStorage.multiRemove([STORE_KEY, META_KEY]);
    });
  },
};
