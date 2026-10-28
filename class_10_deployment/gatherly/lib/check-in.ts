import { eq } from 'drizzle-orm';
import { checkIns, tickets } from '../db/schema';
import { db } from '../db';

export type CheckInResult =
  | {
      ok: true;
      attendee: string;
      ticketType: string;
      event: string;
      checkedInAt: Date;
    }
  | {
      ok: false;
      status: 403 | 404 | 409 | 422;
      code: 'unknown_ticket' | 'forbidden' | 'not_paid' | 'already_checked_in';
      message: string;
    };

export async function checkIn(ticketCode: string, organizerId: string): Promise<CheckInResult> {
  const ticket = await db.query.tickets.findFirst({
    where: eq(tickets.code, ticketCode),
    with: {
      order: { columns: { status: true } },
      ticketType: {
        columns: { name: true },
        with: { event: { columns: { title: true, organizerId: true } } },
      },
    },
  });
  if (!ticket) return { ok: false, status: 404, code: 'unknown_ticket', message: 'No such ticket' };

  // 403: we know who you are, and it's not your event.
  if (ticket.ticketType.event.organizerId !== organizerId) {
    return {
      ok: false,
      status: 403,
      code: 'forbidden',
      message: "This ticket is for another organizer's event",
    };
  }
  // 422: a real ticket, but not a valid one — the order was never paid.
  if (ticket.order.status !== 'paid') {
    return {
      ok: false,
      status: 422,
      code: 'not_paid',
      message: `Order is ${ticket.order.status}, not paid`,
    };
  }

  // The unique index on check_ins.ticket_id decides who wins, even for two
  // scanners at once. onConflictDoNothing + returning: an empty result means "already in".
  const [row] = await db
    .insert(checkIns)
    .values({ ticketId: ticket.id, checkedInBy: organizerId })
    .onConflictDoNothing({ target: checkIns.ticketId })
    .returning({ checkedInAt: checkIns.checkedInAt });

  // 409: the request conflicts with the current state — this ticket already got in.
  if (!row) {
    return {
      ok: false,
      status: 409,
      code: 'already_checked_in',
      message: 'Ticket already checked in',
    };
  }

  return {
    ok: true,
    attendee: ticket.attendeeName,
    ticketType: ticket.ticketType.name,
    event: ticket.ticketType.event.title,
    checkedInAt: row.checkedInAt,
  };
}
