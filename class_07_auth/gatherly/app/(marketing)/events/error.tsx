'use client'; // error boundaries are a client feature

import { Button } from '@/components/ui/button';

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
      <p className="mt-1 line-clamp-3 font-mono text-xs break-all text-red-800">{error.message}</p>
      {error.digest && <p className="mt-1 text-xs text-red-700">Error ID: {error.digest}</p>}
      {/* retry() re-fetches and re-renders the segment; reset() only re-renders. */}
      <Button className="mt-4" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
