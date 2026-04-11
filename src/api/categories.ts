import { apiRequest } from './client';

export interface UserCategoryData {
  id: string;
  userId: string;
  name: string;
  type: 'expense' | 'income';
  emoji: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
}

export const getCategories = () =>
  apiRequest<UserCategoryData[]>('/categories');

export const createCategory = (data: {
  name: string;
  type: 'expense' | 'income';
  emoji?: string;
  color?: string;
}) =>
  apiRequest<UserCategoryData>('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateCategory = (id: string, data: Partial<{
  name: string;
  emoji: string;
  color: string;
}>) =>
  apiRequest<UserCategoryData>(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteCategory = (id: string) =>
  apiRequest<{ message: string }>(`/categories/${id}`, {
    method: 'DELETE',
  });
