import { apiRequest } from './client';

export interface TodoNote {
  id: string;
  userId: string;
  title: string;
  body: string;
  isDone: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  dueTime: string | null;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getTodos = () =>
  apiRequest<TodoNote[]>('/todos');

export const createTodo = (data: {
  title: string;
  body?: string;
  priority?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  color?: string;
  pinned?: boolean;
}) =>
  apiRequest<TodoNote>('/todos', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateTodo = (id: string, data: Partial<{
  title: string;
  body: string;
  isDone: boolean;
  priority: string;
  dueDate: string | null;
  dueTime: string | null;
  color: string;
  pinned: boolean;
}>) =>
  apiRequest<TodoNote>(`/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteTodo = (id: string) =>
  apiRequest<{ message: string }>(`/todos/${id}`, {
    method: 'DELETE',
  });
