import { apiRequest } from './client';
import type { ChatMessage, Nudge, Insight } from '../types';
import { scrubPII } from '../utils/piiFilter';

export const chatWithTomo = (message: string, history: ChatMessage[]) => {
  // Spec §7 — MANDATORY: strip cards/accounts/OTPs/passwords before any AI call.
  const scrubbedMessage = scrubPII(message);
  const scrubbedHistory = history.slice(-8).map((m) =>
    m.role === 'user' ? { ...m, content: scrubPII(m.content) } : m,
  );
  return apiRequest<{ response: string }>('/tomo/chat', {
    method: 'POST',
    body: JSON.stringify({ message: scrubbedMessage, history: scrubbedHistory }),
  });
};

export const getNudge = () => apiRequest<Nudge>('/tomo/nudge');

export const getInsights = () => apiRequest<{ insights: Insight[] }>('/insights');
