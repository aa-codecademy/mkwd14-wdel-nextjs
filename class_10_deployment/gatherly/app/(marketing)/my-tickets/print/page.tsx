import Link from 'next/link';
import { PrintButton } from '../_components/print-button';
import { Suspense } from 'react';
import { PrintableTickets } from '../_components/printable-tickets';

export default function PrintPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/my-tickets" className="text-brand-500 hover:underline">
          ← My tickets
        </Link>
        <PrintButton />
      </div>
      <Suspense fallback={<p className="mt-6 text-muted-foreground">Loading your tickets…</p>}>
        <PrintableTickets />
      </Suspense>
    </div>
  );
}
