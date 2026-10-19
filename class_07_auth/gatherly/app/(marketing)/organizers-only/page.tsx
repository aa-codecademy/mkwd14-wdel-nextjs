import Link from 'next/link';

/**
 * ROUTE: /organizers-only   — "you're signed in, but this isn't for you".
 *
 * Where requireOrganizer() (lib/session.ts) sends a signed-in attendee: authenticated, but not
 * authorized. That's a 403, not a 401 — they are who they say, they just may not.
 *
 * Compare the two answers an app can give a user who can't open a page:
 *   not signed in            -> /sign-in      "Who are you? Log in."      (401: authentication)
 *   signed in, wrong role    -> this page      "We know you. Not allowed." (403: authorization)
 * Sending an attendee to the sign-in page would be confusing: they ARE signed in.
 *
 * It lives in the (marketing) group on purpose, so it has the normal site header and the attendee can
 * click away. (The dashboard layout has no header, and they'd be stuck.)
 */
export default function OrganizersOnlyPage() {
  return (
    <div className="mx-auto max-w-prose py-10 text-center">
      <h1 className="text-2xl font-bold text-brand-900">The dashboard is for organizers</h1>
      <p className="mt-2 text-muted-foreground">
        {/* `&apos;` is how you write an apostrophe inside JSX text (React lints raw ' characters). */}
        You&apos;re signed in, but your account is an attendee account.
      </p>
      <Link href="/events" className="mt-6 inline-block text-brand-500 hover:underline">
        Browse events
      </Link>
    </div>
  );
}
