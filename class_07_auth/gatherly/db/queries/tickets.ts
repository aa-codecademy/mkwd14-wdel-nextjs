import { and, asc, count, eq, ne, sql } from 'drizzle-orm';
import { db } from '..';
import { orders, tickets, ticketTypes } from '../schema';

export async function getTicketsAvailability(eventId: string) {
  const rows = await db
    .select({
      id: ticketTypes.id,
      name: ticketTypes.name,
      priceCents: ticketTypes.priceCents,
      quantity: ticketTypes.quantity,

      sold: sql<number>`count(${orders.id})`.mapWith(Number),
    })
    .from(ticketTypes)
    .leftJoin(tickets, eq(tickets.ticketTypeId, ticketTypes.id))
    .leftJoin(orders, and(eq(orders.id, tickets.orderId), ne(orders.status, 'canceled')))
    .where(eq(ticketTypes.eventId, eventId))
    .groupBy(ticketTypes.id)
    .orderBy(asc(ticketTypes.priceCents));

  return rows.map((row) => ({ ...row, remaining: Math.max(0, row.quantity - row.sold) }));
}

export async function getUserTicketsCount(eventId: string, userId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(tickets)
    .innerJoin(orders, eq(orders.id, tickets.orderId))
    .where(
      and(eq(orders.eventId, eventId), eq(orders.userId, userId), ne(orders.status, 'canceled')),
    );

  return row?.n ?? 0;
}
