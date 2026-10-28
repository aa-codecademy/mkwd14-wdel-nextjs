import { getUserTickets } from '../../../../db/queries/tickets';
import { formatEventDate } from '../../../../lib/format';
import { requireUser } from '../../../../lib/session';

export async function PrintableTickets() {
  const user = await requireUser('/my-tickets/print');

  const tickets = (await getUserTickets(user.id)).filter((ticket) => ticket.status === 'paid');

  if (tickets.length === 0) {
    return <p className="mt-6 text-muted-foreground">No paid tickets to print yet.</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      {tickets.map((ticket) => (
        <article
          key={ticket.id}
          className="break-inside-avoid rounded-card border-2 border-dashed border-gray-400 p-6"
        >
          <p className="text-sm text-muted-foreground">Gatherly ticket</p>
          <h2 className="text-xl font-bold">{ticket.eventTitle}</h2>
          <p>
            {formatEventDate(ticket.startsAt)} · {ticket.city}
          </p>
          <p className="mt-3">
            {ticket.attendeeName} · {ticket.ticketType}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Show this code at the door</p>
          <p className="font-mono text-lg font-semibold break-all">{ticket.code}</p>
        </article>
      ))}
    </div>
  );
}
