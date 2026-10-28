/**
 * ROUTE: /dashboard/check-in: the door screen for event day.
 *
 * An organizer opens this on a phone or laptop, types (or scans) the code printed on a ticket, and the
 * ticket is marked as used. This is the "session" way in: the organizer is signed in on this device.
 * Tablets that aren't signed in use the API with a scanner token instead (lib/api-tokens.ts).
 *
 * The page itself reads no cookies. The auth check lives in <CheckInGate>, which reads the session and
 * hits the database. It is wrapped in <Suspense> so the title and text are sent right away and the gate
 * streams in after it, with the fallback shown meanwhile (the same streaming idea as loading.tsx).
 */
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
