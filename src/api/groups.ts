import { apiRequest } from './client';

export interface GroupSummary {
  id: string;
  name: string;
  emoji: string | null;
  createdAt: string;
  memberCount: number;
}

export interface GroupMember {
  id: string;
  name: string;
  upiVpa: string | null;
}

export interface GroupDetail {
  id: string;
  name: string;
  emoji: string | null;
  createdBy: string;
  createdAt: string;
  members: GroupMember[];
}

export interface SharedExpenseSplit {
  id: string;
  owedBy: string;
  amount: number;
  settledAt: string | null;
  settlementMethod: string | null;
}

export interface SharedExpense {
  id: string;
  groupId: string;
  paidBy: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt: string;
  splits: SharedExpenseSplit[];
}

export interface BalancePair {
  debtor: GroupMember;
  creditor: GroupMember;
  amount: number;
}

export interface BalanceNet {
  user: GroupMember;
  net: number;
}

export interface BalancesResponse {
  nets: BalanceNet[];
  pairs: BalancePair[];
}

// CRUD
export const createGroup = (name: string, emoji?: string) =>
  apiRequest<GroupDetail>('/groups', {
    method: 'POST',
    body: JSON.stringify({ name, emoji }),
  });

export const listGroups = () =>
  apiRequest<{ groups: GroupSummary[] }>('/groups');

export const getGroupDetail = (gid: string) =>
  apiRequest<GroupDetail>(`/groups/${gid}`);

export const archiveGroup = (gid: string) =>
  apiRequest<{ ok: boolean }>(`/groups/${gid}`, { method: 'DELETE' });

// Invites
export const createInvite = (gid: string) =>
  apiRequest<{ code: string; expiresAt: string }>(`/groups/${gid}/invites`, { method: 'POST' });

export const joinByCode = (code: string) =>
  apiRequest<{ groupId: string; joined?: boolean; alreadyMember?: boolean }>('/groups/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

// Expenses
export interface SplitInput { userId: string; amount: number | string }

export const logSharedExpense = (
  gid: string,
  payload: { amount: number; description: string; category: string; date: string; splits: SplitInput[] },
) =>
  apiRequest<SharedExpense>(`/groups/${gid}/expenses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const listSharedExpenses = (gid: string) =>
  apiRequest<{ expenses: SharedExpense[] }>(`/groups/${gid}/expenses`);

export const deleteSharedExpense = (gid: string, eid: string) =>
  apiRequest<{ ok: boolean }>(`/groups/${gid}/expenses/${eid}`, { method: 'DELETE' });

// Balances
export const getBalances = (gid: string) =>
  apiRequest<BalancesResponse>(`/groups/${gid}/balances`);

// Settlement
export interface SettleResponse {
  upiLink?: string;
  settled?: boolean;
  settledAt?: string;
}

export const settleSplit = (gid: string, sid: string, method: 'upi' | 'cash' | 'manual' | 'bank') =>
  apiRequest<SettleResponse>(`/groups/${gid}/splits/${sid}/settle`, {
    method: 'POST',
    body: JSON.stringify({ method }),
  });

export const confirmUpiSettlement = (gid: string, sid: string) =>
  apiRequest<SettleResponse>(`/groups/${gid}/splits/${sid}/settle/confirm`, { method: 'POST' });
