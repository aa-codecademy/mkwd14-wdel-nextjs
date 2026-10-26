/**
 * ERROR BOUNDARY for /events and everything below it (the list AND the event page).
 *
 * If a database query throws while rendering, Next.js shows THIS instead of the broken part. The header,
 * the footer and the layout (breadcrumb) stay on screen. It's the same `error.tsx` you met in class 2
 * (examples/app/error-examples), now in real use. See that example for the rules:
 *   - it must be a Client Component ('use client'),
 *   - it only catches errors thrown while RENDERING,
 *   - it does not catch errors in the layout of its own folder (that's global-error.tsx's job, next to it).
 */
'use client'; // error boundaries are a client feature

import { Button } from '@/components/ui/button';

// `error` is the thrown error, `retry` re-renders the segment. (Older tutorials call it `reset`.)
export default function EventsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="rounded-card border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-red-900">We couldn&apos;t load events.</h2>
      {/* In production, server errors arrive with a generic message; the digest matches the server log. */}
      {/* Database errors can be long: Drizzle puts the whole failed SQL in the message. */}
      {/* `line-clamp-3` cuts the text after 3 lines, `break-all` lets a long unbroken SQL string wrap. */}
      <p className="mt-1 line-clamp-3 font-mono text-xs break-all text-red-800">{error.message}</p>
      {/* The digest only exists for SERVER errors: a short id that matches a line in the server log, so a user can report "Error ID abc123" without ever seeing the real message. */}
      {error.digest && <p className="mt-1 text-xs text-red-700">Error ID: {error.digest}</p>}
      {/* retry() re-fetches and re-renders the segment; reset() only re-renders. */}
      <Button className="mt-4" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
