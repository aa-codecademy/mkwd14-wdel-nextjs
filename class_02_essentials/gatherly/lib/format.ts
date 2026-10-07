/**
 * Helpers that turn raw data into text for humans.
 * Keeping them here means every component formats dates and prices the same way.
 */

// Create the formatter ONCE, at module level. Building an Intl formatter is
// relatively expensive, and using it is cheap, so we reuse one instance.
// `en-GB` gives "Fri, 12 Mar 2027, 09:00".
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  // Always show Skopje time, whatever time zone the server or the visitor is in.
  // Without it the server (UTC) and the browser could print different hours.
  timeZone: 'Europe/Skopje',
});

// A Date is just a moment in time (UTC). The formatter decides how it is displayed.
export function formatEventDate(date: Date): string {
  return dateFormat.format(date);
}

// Prices are stored in CENTS (4900 = 49.00) to avoid floating-point rounding errors.
// Convert to euros only when displaying.
const priceFormat = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });

export function formatPrice(cents: number): string {
  return cents === 0 ? 'Free' : `From ${priceFormat.format(cents / 100)}`;
}
