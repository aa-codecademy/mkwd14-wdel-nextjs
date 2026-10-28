/**
 * CHECK-IN: the business rule "let this ticket in", in ONE place.
 *
 * Two doors lead here: the Server Action behind /dashboard/check-in (the organizer is signed in, see
 * app/actions/check-in.ts) and an HTTP API for scanner devices (they authenticate with a token from
 * lib/api-tokens.ts). Both call checkIn() so the rules can't drift apart, the same idea as lib/roles.ts.
 *
 * `organizerId` must come from the SESSION or the token, never from user input: it is what we compare
 * with the event's owner. The function returns a RESULT object instead of throwing, so each caller
 * decides how to show it: a message in the form, or an HTTP status in the API.
 *
 * The rules, in order, each with its HTTP status:
 *   404 unknown_ticket       no ticket has this code
 *   403 forbidden            the ticket belongs to ANOTHER organizer's event (ownership check)
 *   422 not_paid             the order isn't paid (pending, refunded...), so the ticket isn't valid
 *   409 already_checked_in   somebody already scanned it
 *   ok                       first successful scan: a check_ins row is written
 */
import { eq } from 'drizzle-orm';
import { checkIns, tickets } from '../db/schema';
import { db } from '../db';

// A DISCRIMINATED UNION: `ok` is the tag. After `if (!result.ok)` TypeScript knows `status`, `code` and
// `message` exist; in the other branch it knows `attendee`, `event`... exist. No optional fields to guess.
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

// `ticketCode` is the code printed on the ticket (tickets.code). It is data typed or scanned by a person,
// so it is untrusted, but it only goes into a parameterized Drizzle query, never into raw SQL.
export async function checkIn(ticketCode: string, organizerId: string): Promise<CheckInResult> {
  // ONE query loads everything the rules need: the ticket, its order (for the payment status) and, through
  // its ticket type, the event (for its title and OWNER). `columns` limits each table to what we use.
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
  // 404 first: nothing else can be checked without a ticket.
  if (!ticket) return { ok: false, status: 404, code: 'unknown_ticket', message: 'No such ticket' };

  // OWNERSHIP check: without it, any organizer could check in (or probe) tickets of other organizers' events.
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

  // Why not 'SELECT, then INSERT if none'? Two scanners could both see "not checked in" and both insert.
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
