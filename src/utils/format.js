export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(num);
};

export const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = typeof timestamp === 'number'
    ? new Date(timestamp * 1000)
    : new Date(timestamp);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('es-ES').format(Number(num) || 0);
};
