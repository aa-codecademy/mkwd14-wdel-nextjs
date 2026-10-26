import { getOrganizerStats } from '../../../../../db/queries/dashboard';
import { formatPrice } from '../../../../../lib/format';
import { requireOrganizer } from '../../../../../lib/session';

export default async function StatusSlot() {
  const organizer = await requireOrganizer('/dashboard');
  const stats = await getOrganizerStats(organizer.id);

  const tiles = [
    { label: 'Published events', value: stats.published ?? 0 },
    { label: 'Drafts', value: stats.drafts ?? 0 },
    { label: 'Tickets sold', value: stats.paidTickets ?? 0 },
    { label: 'Awaiting payment', value: stats.pendingTickets ?? 0 },
    // { label: 'Checked in', value: stats.checkesdIn ?? 0 },
    { label: 'Revenue', value: formatPrice(stats.revenueCents) },
  ];
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
