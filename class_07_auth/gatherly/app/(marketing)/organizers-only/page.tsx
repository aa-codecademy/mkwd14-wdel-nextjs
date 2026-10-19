import Link from 'next/link';

// Where requireOrganizer() sends a signed-in attendee: authenticated, but not
// authorized. That's a 403, not a 401 — they are who they say, they just may not.
export default function OrganizersOnlyPage() {
  return (
    <div className="mx-auto max-w-prose py-10 text-center">
      <h1 className="text-2xl font-bold text-brand-900">The dashboard is for organizers</h1>
      <p className="mt-2 text-muted-foreground">
        You&apos;re signed in, but your account is an attendee account.
      </p>
      <Link href="/events" className="mt-6 inline-block text-brand-500 hover:underline">
        Browse events
      </Link>
    </div>
  );
}
