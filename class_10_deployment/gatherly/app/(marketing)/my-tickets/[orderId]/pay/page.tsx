/**
 * ROUTE: /my-tickets/[orderId]/pay   — the (mock) checkout for one pending order.
 *
 * `[orderId]` is a dynamic segment: the order's id from the URL. That id comes from the browser, so it is
 * UNTRUSTED input. Like other pages here, we pass the `params` Promise to a child (<Checkout>) inside
 * <Suspense> without awaiting it. <Checkout> validates the id, loads the order AND checks it belongs to the
 * signed-in user. The page only lays things out.
 */
import { Suspense } from 'react';
import { Checkout } from '../../_components/checkout';

export default function PayPage({ params }: PageProps<'/my-tickets/[orderId]/pay'>) {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-brand-900">Checkout</h1>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">Loading your order…</p>}>
        <Checkout params={params} />
      </Suspense>
    </div>
  );
}
