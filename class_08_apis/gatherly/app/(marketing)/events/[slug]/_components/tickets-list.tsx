/**
 * TicketsList — the ticket types of an event, each with its Reserve button.
 *
 * An ASYNC SERVER Component: it reads the database itself. It sits inside its own <Suspense> on the event
 * page, so the main event info shows first and this block streams in (with a skeleton) when ready.
 *
 * It passes PLAIN DATA (an id and a number) to the client component <ReserveButton>. The seat counts
 * were computed on the server, so the browser never sees the raw tables.
 */
import { getTicketsAvailability } from '../../../../../db/queries/tickets';
import { formatPrice } from '../../../../../lib/format';
import { ReserveButton } from './reserve-button';

export async function TicketsList({ eventId }: { eventId: string }) {
  const ticketTypes = await getTicketsAvailability(eventId);

  // An event with no ticket types (e.g. one created with the form, which doesn't save them yet):
  // show nothing at all rather than an empty "Tickets" box.
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
