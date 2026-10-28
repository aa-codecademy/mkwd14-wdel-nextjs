'use client';

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
