import Link from 'next/link';
import { getUserTickets } from '../../../../db/queries/tickets';
import { requireUser } from '../../../../lib/session';
import { formatEventDate, formatPrice } from '../../../../lib/format';
import { Badge } from '../../../../components/ui/badge';
import { buttonVariants } from '../../../../components/ui/button';

export async function TicketList() {
  const user = await requireUser('/my-tickets');
  const tickets = await getUserTickets(user.id);

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

  const anyPaid = tickets.some((ticket) => ticket.status === 'paid');

  return (
    <>
      {anyPaid && (
        <div className="mt-2">
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
            {ticket.checkedInAt ? (
              <Badge variant="secondary">checked in</Badge>
            ) : (
              <Badge variant={ticket.status === 'paid' ? 'default' : 'outline'}>
                {ticket.status}
              </Badge>
            )}
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
