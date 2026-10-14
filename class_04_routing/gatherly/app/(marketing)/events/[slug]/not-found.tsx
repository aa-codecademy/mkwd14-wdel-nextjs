/**
 * 404 UI for /events/[slug]
 *
 * Shown when app/events/[slug]/page.tsx calls notFound(), e.g. /events/does-not-exist.
 * Next.js also sends an HTTP 404 status, which matters for search engines.
 *
 * Because this file sits right next to the page, it wins over any not-found.tsx further up
 * the tree. The message can be specific to events, and it keeps the header, footer and the
 * events layout around it (only the page itself is replaced).
 * (See class 02, examples/app/error-examples for the same mechanism in isolation.)
 */
import Link from 'next/link';

export default function EventNotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">No such event.</h1>
      <p className="mt-2 text-muted-foreground">Event can not be found.</p>
      <Link href="/events" className="mt-6 inline-block text-brand-500 hover:underline">
        Browse all events
      </Link>
    </div>
  );
}
