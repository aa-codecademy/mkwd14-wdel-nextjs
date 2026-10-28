/**
 * AccountMenu — the top-right of the header: "Sign in", or the user's name + "Sign out".
 *
 * A CLIENT component. It reads the session with the `useSession()` HOOK from the auth client: the
 * browser asks /api/auth/get-session, and the component re-renders when the answer changes (sign-in,
 * sign-out, even in another tab). That is why it's a Client Component and not a server one.
 *
 * The three states it handles:
 *   loading (`isPending`)  -> an invisible placeholder (so the header doesn't jump)
 *   no session             -> a "Sign in" link
 *   session                -> the Dashboard link (organizers only) + name + "Sign out"
 *
 * ⚠️ The menu is DECORATION, not security. Hiding the Dashboard link from attendees is a courtesy.
 * Nothing stops an attendee from typing /dashboard, which is why the page itself calls
 * requireOrganizer(). Never rely on "the button isn't shown" to protect anything.
 */
'use client';

import { useRouter } from 'next/navigation';
import { signOut, useSession } from '../lib/auth-client';
import Link from 'next/link';
import { canManageEvents } from '../lib/roles';

export function AccountMenu() {
  // `data` is the session ({ user, session }) or null. `isPending` is true on the first load.
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // `aria-hidden`: an empty box with a width, ignored by screen readers.
  if (isPending) return <span className="w-16" aria-hidden />;

  if (!session) {
    return (
      <Link href="/sign-in" className="hover:text-brand-500">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* The role comes with the session, typed thanks to `adminClient()` in lib/auth-client.ts. */}
      <Link href="/my-tickets" className="hover:text-brand-500">
        My tickets
      </Link>
      {canManageEvents(session.user.role) && (
        <Link href="/dashboard" className="hover:text-brand-500">
          Dashboard
        </Link>
      )}

      <span className="text-muted-foreground">{session.user.name}</span>
      <button
        className="cursor-pointer hover:text-brand-500"
        onClick={async () => {
          // Deletes the session row and the cookie.
          await signOut();
          // Server Components (the page you're on) were rendered for the OLD user. `refresh()` re-runs
          // them for the new situation, so a protected page doesn't stay on screen after signing out.
          router.refresh();
        }}
      >
        Sign out
      </button>
    </div>
  );
}
