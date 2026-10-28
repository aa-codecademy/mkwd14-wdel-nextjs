/**
 * ROUTE: /my-tickets/print   — a printer-friendly page with one "ticket" card per PAID ticket.
 *
 * The toolbar (back link + Print button) is for the screen only: Tailwind's `print:hidden` variant applies
 * `display: none` under @media print, so the paper contains just the tickets. <PrintButton> is a client
 * component because `window.print()` exists only in the browser; the tickets themselves are server-rendered.
 */
import Link from 'next/link';
import { PrintButton } from '../_components/print-button';
import { Suspense } from 'react';
import { PrintableTickets } from '../_components/printable-tickets';

export default function PrintPage() {
  return (
    <div className="max-w-2xl">
      {/* `print:hidden` = hide when printing. */}
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
