/**
 * Checkout — the MOCK payment screen for one pending order (a Server Component).
 *
 * Nothing real is charged: it only demonstrates the shape of a checkout. Choosing a "method" has no effect,
 * and submitting calls the Server Action payOrder() (app/actions/orders.ts), which flips the order to 'paid'.
 *
 * The guards, in order (every one of them runs on the server):
 *   1. requireUser         -> must be signed in
 *   2. z.uuid()            -> the id from the URL must look like a uuid (else 404, not a database error)
 *   3. getUserOrder(id, user.id) -> the order must exist AND belong to this user. Someone else's order
 *                             gives the same 404 as a made-up one, so ids can't be probed.
 *   4. status === 'pending'-> already paid (or cancelled)? Nothing to pay: back to the list.
 */
import z from 'zod';
import { requireUser } from '../../../../lib/session';
import { notFound, redirect } from 'next/navigation';
import { getUserOrder } from '../../../../db/queries/tickets';
import { formatEventDate, formatPrice } from '../../../../lib/format';
import { SubmitButton } from '../../../../components/submit-button';
import Link from 'next/link';
import { payOrder } from '../../../actions/orders';

// The options shown as radio buttons. `as const` makes the array a tuple of literal strings.
const METHODS = ['PayPal', 'Card', 'Apple Pay'] as const;

export async function Checkout({ params }: Pick<PageProps<'/my-tickets/[orderId]/pay'>, 'params'>) {
  // `params` is a Promise in Next 16, so we await it here, inside the Suspense boundary of the page.
  const { orderId } = await params;
  const user = await requireUser(`/my-tickets/${orderId}/pay`);

  // The URL is user input: anyone can type /my-tickets/banana/pay. `safeParse` doesn't throw, it returns a result.
  const id = z.uuid().safeParse(orderId);
  if (!id.success) {
    notFound();
  }

  // The OWNERSHIP check is inside the query (WHERE id = ? AND user_id = ?): the order is found only if it's yours.
  const order = await getUserOrder(id.data, user.id);
  if (!order) {
    notFound();
  }

  // Paid / refunded / cancelled orders have no checkout. (A pending order is the only payable one.)
  if (order.status !== 'pending') {
    redirect('/my-tickets');
  }

  return (
    // `action` takes a Server Action. `.bind(null, order.id)` pre-fills the first argument, so the action is
    // called as payOrder(order.id, formData) when the form is submitted. Works without client JavaScript.
    // ⚠️ The bound id travels through the browser too: it is NOT trusted, payOrder() validates and checks ownership again.
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
          // `defaultChecked={i === 0}` preselects the first option. The chosen value is sent as formData `method`,
          // but payOrder() ignores it: this is a mock.
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
        {/* SubmitButton is a client component that disables itself while the action runs (no double payments). */}
        <SubmitButton pendingText="Paying…">
          {/* A free ticket says "Confirm" instead of "Pay €0.00". */}
          {order.totalCent === 0 ? 'Confirm' : `Pay ${formatPrice(order.totalCent)}`}
        </SubmitButton>
        <Link href="/my-tickets" className="text-sm text-muted-foreground hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
