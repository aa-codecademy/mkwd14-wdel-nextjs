import z from 'zod';
import { requireUser } from '../../../../lib/session';
import { notFound, redirect } from 'next/navigation';
import { getUserOrder } from '../../../../db/queries/tickets';
import { formatEventDate, formatPrice } from '../../../../lib/format';
import { SubmitButton } from '../../../../components/submit-button';
import Link from 'next/link';
import { payOrder } from '../../../actions/orders';

const METHODS = ['PayPal', 'Card', 'Apple Pay'] as const;

export async function Checkout({ params }: Pick<PageProps<'/my-tickets/[orderId]/pay'>, 'params'>) {
  const { orderId } = await params;
  const user = await requireUser(`/my-tickets/${orderId}/pay`);

  const id = z.uuid().safeParse(orderId);
  if (!id.success) {
    notFound();
  }

  const order = await getUserOrder(id.data, user.id);
  if (!order) {
    notFound();
  }

  if (order.status !== 'pending') {
    redirect('/my-tickets');
  }

  return (
    <form action={payOrder.bind(null, order.id)} className="mt-6 space-y-6">
      <div className="rounded-card border border-border p-4">
        <p className="font-medium">{order.event.title}</p>
        <p className="text-sm text-muted-foreground">
          {formatEventDate(order.event.startsAt)} · {order.event.city}
        </p>
        <ul className="mt-2 text-sm">
          {order.tickets.map((ticket) => (
            <li key={ticket.id}>1 × {ticket.ticketType.name}</li>
          ))}
        </ul>
        <p className="mt-2 font-semibold">Total: {formatPrice(order.totalCent)}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 font-medium">Pay with</legend>
        {METHODS.map((method, i) => (
          <label
            key={method}
            className="flex items-center gap-3 rounded-card border border-border p-3"
          >
            <input type="radio" name="method" value={method} defaultChecked={i === 0} />
            {method}
          </label>
        ))}
      </fieldset>

      <p className="rounded-card bg-amber-50 p-3 text-sm text-amber-900">
        This is a mock checkout. Nothing is charged and you are not sent anywhere.
      </p>

      <div className="flex items-center gap-4">
        <SubmitButton pendingText="Paying…">
          {order.totalCent === 0 ? 'Confirm' : `Pay ${formatPrice(order.totalCent)}`}
        </SubmitButton>
        <Link href="/my-tickets" className="text-sm text-muted-foreground hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
