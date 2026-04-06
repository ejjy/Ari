export const formatCurrency = (amount: number): string => {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  return `₹${formatted}`;
};

export const formatCurrencyFull = (amount: number): string => {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${formatCurrency(Math.abs(amount))}`;
};
