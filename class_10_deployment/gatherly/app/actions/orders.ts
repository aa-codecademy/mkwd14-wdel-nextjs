'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/session';
import z from 'zod';
import { orders } from '../../db/schema';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';

export async function payOrder(orderId: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in?next=/my-tickets');
  }

  const id = z.uuid().safeParse(orderId);

  if (!id.success) {
    redirect('/my-tickets');
  }

  await db
    .update(orders)
    .set({ status: 'paid' })
    .where(and(eq(orders.id, id.data), eq(orders.userId, user.id), eq(orders.status, 'pending')));

  redirect('/my-tickets');
}
