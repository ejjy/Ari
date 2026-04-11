import { apiRequest } from './client';
import type { TaxProfile } from '../types';

export const getTaxProfile = () =>
  apiRequest<TaxProfile | null>('/tax-profile');

export const saveTaxProfile = (data: Partial<TaxProfile>) =>
  apiRequest<TaxProfile>('/tax-profile', {
    method: 'POST',
    body: JSON.stringify(data),
  });
