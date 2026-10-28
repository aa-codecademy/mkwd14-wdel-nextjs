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
