/**
 * SERVER ACTION: reserve a ticket.
 *
 * Same family as createEvent (class 6): a 'use server' function the browser can call, so it is a PUBLIC
 * endpoint, and everything it receives must be validated and checked. This one is harder than a plain
 * "save a row" because of a classic problem: OVERSELLING.
 *
 *   A VIP tier has 1 seat left. Two people press "Reserve" in the same millisecond.
 *   If each request does "count sold -> is there room? -> insert", BOTH see 1 seat left, BOTH
 *   insert, and we sold 2 tickets for 1 seat. (This is a "race condition".)
 *
 * The cure is the transaction + LOCK below: the second request must wait until the first has finished,
 * and then it sees "sold out".
 *
 * What the browser sends: ONLY `ticketTypeId`. Everything that matters is decided on the server:
 *   - WHO is buying     -> from the session (getCurrentUser), never from an argument
 *   - the PRICE         -> read from the database, never sent by the browser (or anyone could pay 0)
 *   - whether it's open -> the event must be published, the ticket type must exist, seats must be left
 */
'use server';

import z from 'zod';
// Not requireUser(): that one REDIRECTS. This action is called from a button that wants an answer
// back ("Sign in to reserve"), so we use getCurrentUser() and RETURN a result instead.
import { getCurrentUser } from '../../lib/session';
import { db } from '../../db';
import { events, orders, tickets, ticketTypes } from '../../db/schema';
// `count` = SQL count(*), `ne` = `<>` (not equal), `and` joins conditions.
import { eq, count, and, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// What the action returns. A DISCRIMINATED UNION: `ok` tells TypeScript which shape you have.
//   if (result.ok) { ... }   -> success, nothing else to read
//   else                     -> `result.error` is a message; `result.signIn` says "show a sign-in link"
// Returning a result (instead of throwing) is how a client component learns what happened.
type ReservedResult =
  | {
      ok: true;
    }
  | { ok: false; error: string; signIn?: true };

export async function reserveTicket(ticketTypeId: string): Promise<ReservedResult> {
  // 1. AUTHENTICATE: who is buying? Nobody signed in -> say so, and let the UI show a sign-in link.
  const attendee = await getCurrentUser();
  if (!attendee) {
    return { ok: false, error: 'Sign in to reserve', signIn: true };
  }

  // 2. VALIDATE: the only input is an id, and it must look like a uuid.
  const id = z.uuid().safeParse(ticketTypeId);

  if (!id.success) {
    return { ok: false, error: 'Unknown ticket type' };
  }

  // 3. EVERYTHING ELSE inside ONE TRANSACTION, so the checks and the inserts can't be interleaved with
  //    another buyer's.
  const result = await db.transaction(async (tx) => {
    // `.for('update')` = SELECT ... FOR UPDATE: a ROW LOCK on this ticket type. Any other transaction
    // that wants to lock the same row WAITS here until this one commits. That's what stops two buyers
    // from both seeing "1 left". (Different ticket types have different rows, so they don't block
    // each other.)
    const [type] = await tx
      .select()
      .from(ticketTypes)
      .where(eq(ticketTypes.id, id.data))
      .for('update');

    if (!type) {
      return { ok: false, error: 'Unknown ticket type' };
    }

    const event = await tx.query.events.findFirst({
      where: eq(events.id, type.eventId),
      columns: { slug: true, status: true },
    });

    // Can't buy tickets for a draft or cancelled event (and a made-up id lands here too).
    if (event?.status !== 'published') {
      return { ok: false, error: `This event isn't for sale` };
    }

    // How many seats are taken: tickets of this type whose ORDER is not canceled. (Careful with the
    // spelling: order statuses use 'canceled', one l. Event statuses use 'cancelled', two.)
    const [sold] = await tx
      .select({ n: count() })
      .from(tickets)
      .innerJoin(orders, eq(orders.id, tickets.orderId))
      .where(and(eq(tickets.ticketTypeId, type.id), ne(orders.status, 'cancelled')));

    // Sold out? `sold?.n ?? 0` = 0 if the query returned no row (noUncheckedIndexedAccess).
    if ((sold?.n ?? 0) >= type.quantity) {
      return { ok: false, error: `Sold out`, slug: event.slug };
    }

    // One purchase = one ORDER (who, which event, how much) plus one TICKET row per seat.
    // The user comes from the session; the amount from the database row, never from the browser.
    // (The order keeps the default status 'pending': there is no payment step yet.)
    const [order] = await tx
      .insert(orders)
      .values({
        userId: attendee.id,
        eventId: type.eventId,
        totalCent: type.priceCents,
      })
      .returning({ id: orders.id });

    if (!order) {
      throw new Error('Error while creating the order');
    }

    await tx.insert(tickets).values({
      orderId: order.id,
      ticketTypeId: type.id,
      // The unique code the QR code will carry. A random uuid can't be guessed.
      code: crypto.randomUUID(),
      attendeeName: attendee.name,
    });

    return { ok: true, slug: event.slug };
  });

  // Only AFTER the transaction has committed do we tell Next.js the event page is out of date, so the
  // "N left" and "You have 1 ticket" are re-rendered. (`'slug' in result` narrows the union: some
  // failure results don't carry a slug.)
  if ('slug' in result) {
    revalidatePath(`/events/${result.slug}`);
  }
  // Hand the browser a small, safe result. Not the order, not the slug, nothing internal.
  return result.ok ? { ok: true } : { ok: false, error: result.error ?? '' };
}
