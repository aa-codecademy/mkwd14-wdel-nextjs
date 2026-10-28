/**
 * SLOT @orders: "Recent orders": who bought what, for how much, in what state.
 *
 * Server Component. `getRecentOrders(organizer.id)` only returns orders for events that BELONG to this
 * organizer (see the `where` in db/queries/dashboard.ts). The guard is repeated here because each
 * slot is its own route (see @stats/page.tsx).
 */
import { Badge } from '../../../../../components/ui/badge';
import { getRecentOrders } from '../../../../../db/queries/dashboard';
import { formatEventDate, formatPrice } from '../../../../../lib/format';
import { requireOrganizer } from '../../../../../lib/session';

export default async function OrdersSlot() {
  const organizer = await requireOrganizer('/dashboard');
  const orders = await getRecentOrders(organizer.id);

  // Always handle the EMPTY case: a new organizer has no orders, and a blank box looks broken.
  return (
    <div className="rounded-card border border-border bg-background">
      <h2 className="border-b border-border p-3 font-semibold">Recent orders</h2>
      {orders.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <p className="font-medium">{order.eventTitle}</p>
                <p className="text-muted-foreground">
                  {order.buyer} · {formatEventDate(order.createdAt)}
                </p>
              </div>
              <span>{formatPrice(order.totalCents)}</span>
              {/* Filled badge for paid, a softer one for pending, refunded or canceled. */}
              <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                {order.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
