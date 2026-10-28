/**
 * GLOBAL ERROR — the last safety net: errors thrown in the ROOT LAYOUT itself.
 *
 * An error.tsx can't catch an error in the layout that wraps it, and nothing wraps the root layout.
 * So this file exists. It REPLACES the root layout when it shows, which has three consequences:
 *   1. it must render its own <html> and <body> (there's no layout above it),
 *   2. it must import its own CSS (the root layout's `globals.css` import is gone with it),
 *   3. it must be a Client Component.
 * You will rarely see it. It's the page for "something is very wrong", so keep it simple and
 * dependency-free (no database, no session, no shared components that could throw too).
 */
'use client';

// Catches errors in the ROOT layout itself, so it replaces it: it must render its
// own <html> and <body>, and import its own styles — the root layout's aren't there.
import './globals.css';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-bold">Something went badly wrong.</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button onClick={() => retry()} className="mt-6 underline">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
