import { Suspense } from 'react';
import { CheckInGate } from './_components/check-in-gate';

export default function CheckInPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-brand-900">Check-in</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Enter the code printed on the attendee&apos;s ticket.
      </p>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <CheckInGate />
      </Suspense>
    </div>
  );
}
