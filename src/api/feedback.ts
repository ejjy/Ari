import { apiRequest } from './client';

export const submitFeedback = (data: { message: string; rating?: number }) =>
  apiRequest<{ message: string; id: string }>('/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getMyFeedback = () =>
  apiRequest<Array<{ id: string; message: string; rating: number | null; createdAt: string }>>('/feedback');
