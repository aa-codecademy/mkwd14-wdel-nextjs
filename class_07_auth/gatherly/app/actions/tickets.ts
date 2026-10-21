'use server';

import z from 'zod';
import { getCurrentUser } from '../../lib/session';
import { db } from '../../db';
import { events, orders, tickets, ticketTypes } from '../../db/schema';
import { eq, count, and, ne } from 'drizzle-orm';

type ReservedResult =
  | {
      ok: true;
    }
  | { ok: false; error: string; signIn?: true };

export async function reserveTicket(ticketTypeId: string): Promise<ReservedResult> {
  const attendee = await getCurrentUser();
  if (!attendee) {
    return { ok: false, error: 'Sign in to reserve', signIn: true };
  }

  const id = z.uuid().safeParse(ticketTypeId);

  if (!id.success) {
    return { ok: false, error: 'Unknown ticket type' };
  }

  const result = await db.transaction(async (tx) => {
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

    if (event?.status !== 'published') {
      return { ok: false, error: `This event isn't for sale` };
    }

    const [sold] = await tx
      .select({ n: count() })
      .from(tickets)
      .innerJoin(orders, eq(orders.id, tickets.orderId))
      .where(and(eq(tickets.ticketTypeId, type.id), ne(orders.status, 'canceled')));

    if ((sold?.n ?? 0) >= type.quantity) {
      return { ok: false, error: `Sold out` };
    }

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
      code: crypto.randomUUID(),
      attendeeName: attendee.name,
    });

    return { ok: true };
  });

  return result.ok ? { ok: true } : { ok: false, error: result.error ?? '' };
}
