import { getUserTicketsCount } from '../../../../../db/queries/tickets';
import { getCurrentUser } from '../../../../../lib/session';

export async function YourTickets({ eventId }: { eventId: string }) {
  const user = await getCurrentUser();

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
