export function formatCurrency(value) {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-TZ', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function humanizeStatus(value) {
  if (!value) {
    return 'Unknown';
  }

  return value.replaceAll('_', ' ');
}
