/**
 * QUERIES for tickets: how many are left, and how many YOU have.
 *
 * Remember: a ticket type has a `quantity` (how many exist). Sold tickets are rows in `tickets`, each
 * belonging to an `orders` row. "Left" is therefore computed, never stored:  quantity - sold.
 * (Stored counters drift out of sync with reality. Counting the real rows can't.)
 *
 * ⚠️ Unlike db/queries/events.ts this file has no `import 'server-only'`. Add it, so a Client
 * Component can't import database code by mistake.
 */
import { and, asc, count, eq, ne, sql, desc } from 'drizzle-orm';
import { db } from '..';
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
      // We count ORDERS (not tickets): a ticket whose order was canceled has no matching order row
      // (see the join below), so it isn't counted.
      sold: sql<number>`count(${orders.id})`.mapWith(Number),
    })
    .from(ticketTypes)
    // LEFT JOIN keeps ticket types with NO sales (an inner join would drop them, and "0 sold" would
    // disappear from the page). The 2nd join's `ne(orders.status, 'canceled')` is in the JOIN
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

// How many tickets this user holds for this event (canceled orders don't count). Used to show
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
    .from(tickets)
    .innerJoin(orders, eq(orders.id, tickets.orderId))
    .innerJoin(ticketTypes, eq(ticketTypes.id, tickets.ticketTypeId))
    .innerJoin(events, eq(events.id, orders.eventId))
    .leftJoin(checkIns, eq(checkIns.ticketId, tickets.id))
    .where(and(eq(orders.userId, userId), ne(orders.status, 'cancelled')))
    .orderBy(desc(orders.createdAt));
}

export async function getUserOrder(orderId: string, userId: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    columns: { id: true, status: true, totalCent: true },
    with: {
      event: { columns: { title: true, startsAt: true, city: true } },
      tickets: { columns: { id: true }, with: { ticketType: { columns: { name: true } } } },
    },
  });
}
