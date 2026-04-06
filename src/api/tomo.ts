import { apiRequest } from './client';
import type { ChatMessage, Nudge, Insight } from '../types';

export const chatWithTomo = (message: string, history: ChatMessage[]) =>
  apiRequest<{ response: string }>('/tomo/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history: history.slice(-8) }),
  });

export const getNudge = () => apiRequest<Nudge>('/tomo/nudge');

export const getInsights = () => apiRequest<{ insights: Insight[] }>('/insights');
