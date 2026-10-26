import { Badge } from '../../../../../components/ui/badge';
import { getRecentOrders } from '../../../../../db/queries/dashboard';
import { formatEventDate, formatPrice } from '../../../../../lib/format';
import { requireOrganizer } from '../../../../../lib/session';

export default async function OrdersSlot() {
  const organizer = await requireOrganizer('/dashboard');
  const orders = await getRecentOrders(organizer.id);

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
