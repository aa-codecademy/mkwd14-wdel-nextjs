/**
 * TicketList — the user's tickets with their status (a Server Component, rendered inside <Suspense>).
 *
 * Flow: requireUser() -> getUserTickets(user.id) -> render. The query filters by the user id taken from
 * the SESSION, never from the URL, so everybody only ever sees their own tickets.
 *
 * Status per ticket (the status belongs to the ORDER; a ticket inherits it):
 *   checked in  -> the door scanned it
 *   paid        -> valid, can be printed
 *   pending     -> reserved but not paid yet: shows a "Pay" button that goes to the checkout page
 */
import Link from 'next/link';
import { getUserTickets } from '../../../../db/queries/tickets';
import { requireUser } from '../../../../lib/session';
import { formatEventDate, formatPrice } from '../../../../lib/format';
import { Badge } from '../../../../components/ui/badge';
import { buttonVariants } from '../../../../components/ui/button';

export async function TicketList() {
  // The argument is where to come back to after signing in.
  const user = await requireUser('/my-tickets');
  const tickets = await getUserTickets(user.id);

  // Empty state: guide the user somewhere useful instead of showing a blank list.
  if (tickets.length === 0) {
    return (
      <p className="mt-6 text-muted-foreground">
        No tickets yet.{' '}
        <Link href="/events" className="text-brand-500 hover:underline">
          Browse events
        </Link>
      </p>
    );
  }

  // Show "Print" only if there is something printable.
  const anyPaid = tickets.some((ticket) => ticket.status === 'paid');

  return (
    <>
      {anyPaid && (
        <div className="mt-2">
          {/* `buttonVariants()` gives a <Link> the look of a button (navigation = link, not <button>). */}
          <Link href="/my-tickets/print" className={buttonVariants()}>
            Print my tickets
          </Link>
        </div>
      )}
      <ul className="mt-6 divide-y divide-border rounded-card border border-border">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <Link href={`/events/${ticket.eventSlug}`} className="font-medium hover:underline">
                {ticket.eventTitle}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatEventDate(ticket.startsAt)} · {ticket.city}
              </p>
              <p className="text-sm text-muted-foreground">
                {ticket.ticketType} · {formatPrice(ticket.totalCents)}
              </p>
            </div>
            {/* `checkedInAt` is null until the door scans the ticket (left join on check_ins). */}
            {ticket.checkedInAt ? (
              <Badge variant="secondary">checked in</Badge>
            ) : (
              <Badge variant={ticket.status === 'paid' ? 'default' : 'outline'}>
                {ticket.status}
              </Badge>
            )}
            {/* Only an unpaid order can be paid. The checkout page and payOrder() re-check this on the server. */}
            {ticket.status === 'pending' && (
              <Link
                href={`/my-tickets/${ticket.orderId}/pay`}
                className={buttonVariants({ size: 'sm' })}
              >
                Pay
              </Link>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
