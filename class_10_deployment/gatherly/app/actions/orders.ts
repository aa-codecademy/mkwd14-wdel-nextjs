'use server';

/**
 * SERVER ACTION: pay (confirm) an order.
 *
 * Like every 'use server' function this is a PUBLIC endpoint: anyone can POST to it with any argument, not just
 * the form on the checkout page. So it re-does ALL the checks instead of trusting the page that called it:
 *   1. authenticate   -> who is paying? (from the session)
 *   2. validate       -> `orderId` must be a uuid
 *   3. authorize      -> the UPDATE only matches an order that belongs to this user AND is still pending
 *
 * It's a MOCK: no payment provider is called. A real app would charge the card first (or, more commonly, mark the
 * order paid from the provider's webhook once the money has really arrived), and only then set 'paid'.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/session';
import z from 'zod';
import { orders } from '../../db/schema';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';

export async function payOrder(orderId: string) {
  // getCurrentUser() (not requireUser): inside an action we choose where to redirect, with the return URL.
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in?next=/my-tickets');
  }

  // The argument was bound in the browser (payOrder.bind(null, order.id)), so it can be tampered with.
  const id = z.uuid().safeParse(orderId);

  if (!id.success) {
    redirect('/my-tickets');
  }

  // One UPDATE does the check AND the change. `userId = user.id` is the OWNERSHIP check (you can't pay someone else's
  // order by guessing its id); `status = 'pending'` makes it safe to call twice (a double click or a replay won't
  // re-pay or revive a cancelled/refunded order). If nothing matches, 0 rows change and nothing happens.
  await db
    .update(orders)
    .set({ status: 'paid' })
    .where(and(eq(orders.id, id.data), eq(orders.userId, user.id), eq(orders.status, 'pending')));

  // `redirect()` throws, so it must stay outside try/catch. The list is dynamic (it reads the session), so it
  // shows the new status without revalidatePath here.
  redirect('/my-tickets');
}
