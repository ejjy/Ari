import { useMemo } from 'react';
import { getCurrentMonth } from '../utils/dateHelpers';

export const useCurrentMonth = (): string => {
  return useMemo(() => getCurrentMonth(), []);
};
