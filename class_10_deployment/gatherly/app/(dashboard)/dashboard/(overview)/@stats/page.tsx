/**
 * SLOT @stats: the row of number tiles on top of the dashboard.
 *
 * An async Server Component like any page: it asks WHO is looking (requireOrganizer) and loads the
 * numbers for THAT organizer only (getOrganizerStats(organizer.id), see db/queries/dashboard.ts).
 *
 * Every slot repeats the guard. Slots are separate routes that can be rendered on their own, so each
 * one must protect its own data. (Repeating `requireOrganizer` is cheap, and forgetting it is not.)
 * New in class 10: the "Checked in" tile, counted from the check_ins table.
 */
import { getOrganizerStats } from '../../../../../db/queries/dashboard';
import { formatPrice } from '../../../../../lib/format';
import { requireOrganizer } from '../../../../../lib/session';

// (The function is named StatusSlot, a typo for StatsSlot. The name doesn't matter to Next.js.)
export default async function StatusSlot() {
  const organizer = await requireOrganizer('/dashboard');
  const stats = await getOrganizerStats(organizer.id);

  // The tiles as DATA, rendered with one .map() below, instead of six copies of the same markup.
  // `?? 0`: if a count is missing, show 0 instead of "undefined". Revenue is cents, so it's formatted.
  const tiles = [
    { label: 'Published events', value: stats.published ?? 0 },
    { label: 'Drafts', value: stats.drafts ?? 0 },
    { label: 'Tickets sold', value: stats.paidTickets ?? 0 },
    { label: 'Awaiting payment', value: stats.pendingTickets ?? 0 },
    // NEW: tickets that were scanned at the door (one row in check_ins per ticket, see lib/check-in.ts).
    { label: 'Checked in', value: stats.checkedIn ?? 0 },
    { label: 'Revenue', value: formatPrice(stats.revenueCents) },
  ];
  // <dl>/<dt>/<dd>: a list of label + value pairs, the right element for "Drafts: 3".
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-card border border-border bg-background p-3">
          <dt className="text-xs text-muted-foreground">{tile.label}</dt>
          <dd className="mt-1 text-xl font-semibold text-brand-900">{tile.value}</dd>
        </div>
      ))}
    </dl>
  );
}
