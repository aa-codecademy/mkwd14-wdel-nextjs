/**
 * error.tsx of this SLOT — the error boundary for ONE panel.
 *
 * If the query of this slot throws (the database blinks, a join fails), only THIS panel is replaced by
 * the message below. The layout, the other two panels and the event list keep working. Without a
 * per-slot error.tsx the error would bubble up and replace the whole dashboard.
 *
 * Same rules as any error.tsx (class 2 and 7): a Client Component, `retry()` re-fetches and re-renders
 * just this segment. We ignore `error` on purpose: a user-facing panel shouldn't print a SQL message.
 * (The same file is repeated in each slot, so each panel recovers on its own.)
 */
'use client';

// The props type lists `error` (Next.js passes it) but the component only destructures `retry`.
export default function SlotError({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      Couldn&apos;t load this panel.{' '}
      <button onClick={() => retry()} className="underline">
        Try again
      </button>
    </div>
  );
}
