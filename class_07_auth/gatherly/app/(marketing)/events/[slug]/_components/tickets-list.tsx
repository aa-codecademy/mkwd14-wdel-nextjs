import { getTicketsAvailability } from '../../../../../db/queries/tickets';
import { formatPrice } from '../../../../../lib/format';
import { ReserveButton } from './reserve-button';

export async function TicketsList({ eventId }: { eventId: string }) {
  const ticketTypes = await getTicketsAvailability(eventId);

  if (ticketTypes.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Tickets</h2>
      <ul className="mt-3 divide-y divide-border rounded-card border border-border">
        {ticketTypes.map((type) => (
          <li key={type.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{type.name}</p>
              <p className="text-sm text-muted-foreground">{formatPrice(type.priceCents)}</p>
            </div>
            <ReserveButton ticketTypeId={type.id} remaining={type.remaining} />
          </li>
        ))}
      </ul>
    </section>
  );
}
