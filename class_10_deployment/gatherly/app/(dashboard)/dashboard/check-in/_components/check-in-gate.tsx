/**
 * CheckInGate: the guard for the check-in page, as its own async Server Component.
 *
 * `requireOrganizer` (lib/session.ts) reads the session cookie, so it is request-time work. Putting it in
 * a separate component lets page.tsx wrap just this slow part in <Suspense> and stream it in.
 * Not signed in -> redirect to sign-in (and back here afterwards). Signed in as an attendee -> /organizers-only.
 * Only an organizer or admin gets to see the form. (The Server Action behind the form checks again, see below.)
 */
import { requireOrganizer } from '../../../../../lib/session';
import { CheckInForm } from './check-in-form';

export async function CheckInGate() {
  // We don't need the returned user here, only the side effect: stop (redirect) if not allowed.
  await requireOrganizer('/dashboard/check-in');
  return <CheckInForm />;
}
