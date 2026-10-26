/**
 * YourTickets — "You have 2 tickets for this event", for the signed-in user.
 *
 * A SERVER Component that renders NOTHING (null) unless it has something to say: not signed in -> nothing,
 * no tickets -> nothing. It reads the session (cookie), so it is per-user. That's the reason it's wrapped
 * in its own <Suspense> on the event page: the personal part streams in without delaying the public one.
 */
import { getUserTicketsCount } from '../../../../../db/queries/tickets';
import { getCurrentUser } from '../../../../../lib/session';

export async function YourTickets({ eventId }: { eventId: string }) {
  const user = await getCurrentUser();

  // A visitor has no tickets. (getCurrentUser never redirects, which is what we want in a page's
  // optional corner: requireUser would bounce the whole page to the sign-in screen.)
  if (!user) {
    return null;
  }

  const count = await getUserTicketsCount(eventId, user.id);

  if (count === 0) {
    return null;
  }

  return (
    <p className="mt-6 rounded-card bg-brand-50 px-4 py-3 font-medium text-brand-900">
      You have {count} {count === 1 ? 'ticket' : 'tickets'} for this event.
    </p>
  );
}
