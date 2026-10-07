const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Skopje',
});

export function formatEventDate(date: Date): string {
  return dateFormat.format(date);
}

const priceFormat = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });

export function formatPrice(cents: number): string {
  return cents === 0 ? 'Free' : `From ${priceFormat.format(cents / 100)}`;
}
