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
