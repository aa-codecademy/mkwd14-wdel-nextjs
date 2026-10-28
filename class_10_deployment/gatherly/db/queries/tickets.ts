/**
 * QUERIES for tickets: how many are left, what YOU hold, and (class 10) whether it was scanned at the door.
 *
 * Remember: a ticket type has a `quantity` (how many exist). Sold tickets are rows in `tickets`, each
 * belonging to an `orders` row. "Left" is therefore computed, never stored:  quantity - sold.
 * (Stored counters drift out of sync with reality. Counting the real rows can't.)
 *
 * ⚠️ Unlike db/queries/events.ts this file has no `import 'server-only'`. Add it, so a Client
 * Component can't import database code by mistake.
 */
// `ne` = "not equal" (used to skip cancelled orders), `desc` = newest first.
import { and, asc, count, eq, ne, sql, desc } from 'drizzle-orm';
import { db } from '..';
// `checkIns` is new (class 10, migration 0005): it tells us whether a ticket was already scanned.
import { checkIns, events, orders, tickets, ticketTypes } from '../schema';

// One row per ticket type of the event, with how many are sold and how many remain.
export async function getTicketsAvailability(eventId: string) {
  const rows = await db
    .select({
      id: ticketTypes.id,
      name: ticketTypes.name,
      priceCents: ticketTypes.priceCents,
      quantity: ticketTypes.quantity,

      // A raw SQL fragment for what the builder has no helper for. PostgreSQL's count() comes back as
      // a bigint, which node-postgres delivers as a STRING ("3"), so `.mapWith(Number)` converts it.
      // We count ORDERS (not tickets): a ticket whose order was cancelled has no matching order row
      // (see the join below), so it isn't counted.
      sold: sql<number>`count(${orders.id})`.mapWith(Number),
    })
    .from(ticketTypes)
    // LEFT JOIN keeps ticket types with NO sales (an inner join would drop them, and "0 sold" would
    // disappear from the page). The 2nd join's `ne(orders.status, 'cancelled')` is in the JOIN
    // condition on purpose: put it in WHERE and the ticket types with no orders would vanish again.
    .leftJoin(tickets, eq(tickets.ticketTypeId, ticketTypes.id))
    .leftJoin(orders, and(eq(orders.id, tickets.orderId), ne(orders.status, 'cancelled')))
    .where(eq(ticketTypes.eventId, eventId))
    // GROUP BY: collapse the joined rows back to one per ticket type, so count() counts per type.
    .groupBy(ticketTypes.id)
    // Cheapest first.
    .orderBy(asc(ticketTypes.priceCents));

  // `remaining` = seats left, never below 0 (even if the data is ever inconsistent).
  return rows.map((row) => ({ ...row, remaining: Math.max(0, row.quantity - row.sold) }));
}

// How many tickets this user holds for this event (cancelled orders don't count). Used to show
// "You have 2 tickets". The userId comes from the SESSION, and the query filters by it: a user only
// ever asks about themselves.
export async function getUserTicketsCount(eventId: string, userId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(tickets)
    .innerJoin(orders, eq(orders.id, tickets.orderId))
    .where(
      and(eq(orders.eventId, eventId), eq(orders.userId, userId), ne(orders.status, 'cancelled')),
    );

  return row?.n ?? 0;
}

// NEW (class 10): every ticket the signed-in user holds, for the "My tickets" page (printable tickets + QR code).
// Like all user-owned queries, it filters by the owner: `orders.userId = <the session's user id>`, so nobody can
// list another person's tickets. Cancelled orders are hidden, but pending/paid/refunded still show.
export async function getUserTickets(userId: string) {
  return db
    .select({
      id: tickets.id,
      code: tickets.code,
      attendeeName: tickets.attendeeName,
      ticketType: ticketTypes.name,
      orderId: orders.id,
      status: orders.status,
      totalCents: orders.totalCent,
      eventTitle: events.title,
      eventSlug: events.slug,
      startsAt: events.startsAt,
      city: events.city,
      checkedInAt: checkIns.checkedInAt, // null until the door scans it
    })
    // A ticket knows its order and its ticket type, and the event is reached through the order.
    .from(tickets)
    .innerJoin(orders, eq(orders.id, tickets.orderId))
    .innerJoin(ticketTypes, eq(ticketTypes.id, tickets.ticketTypeId))
    .innerJoin(events, eq(events.id, orders.eventId))
    // LEFT JOIN: most tickets have NO check-in row yet. An inner join would hide every unscanned ticket,
    // and `checkedInAt` would simply be null for those that remain visible.
    .leftJoin(checkIns, eq(checkIns.ticketId, tickets.id))
    .where(and(eq(orders.userId, userId), ne(orders.status, 'cancelled')))
    .orderBy(desc(orders.createdAt));
}

// NEW (class 10): ONE order with its event and tickets, for the order confirmation / checkout screen.
// SECURITY: it filters by BOTH the order id (from the URL) and the user id (from the session). The URL is
// user-controlled, so without `eq(orders.userId, userId)` anybody could read another person's order just by
// guessing or changing the id (an "IDOR", insecure direct object reference). A foreign order id simply
// returns undefined, exactly like a missing one, so we don't reveal that it exists.
export async function getUserOrder(orderId: string, userId: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    // Only the columns the screen shows. `with` loads related rows in the same call (relations in schema.ts).
    columns: { id: true, status: true, totalCent: true },
    with: {
      event: { columns: { title: true, startsAt: true, city: true } },
      tickets: { columns: { id: true }, with: { ticketType: { columns: { name: true } } } },
    },
  });
}
