/**
 * SLOT @attendees: "Attendees", the people with a PAID ticket for the organizer's events.
 *
 * Same pattern as the other slots: guard, an owner-filtered query (getRecentAttendees), an empty state.
 * Only orders with status 'paid' count, so an unpaid reservation is not listed as an attendee.
 * Class 10 note: the "checked in" tick below is still commented out. The check_ins table exists now,
 * but getRecentAttendees doesn't select `checkedInAt` yet, so there is nothing to show.
 */
import { getRecentAttendees } from '../../../../../db/queries/dashboard';
import { requireOrganizer } from '../../../../../lib/session';

export default async function AttendeesSlot() {
  // Each slot repeats the guard: slots are separate routes, so each one protects its own data.
  const organizer = await requireOrganizer('/dashboard');
  const attendees = await getRecentAttendees(organizer.id);

  return (
    <div className="rounded-card border border-border bg-background">
      {/* Always handle the EMPTY case: a blank box looks broken. */}
      <h2 className="border-b border-border p-3 font-semibold">Attendees</h2>
      {attendees.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">No paid tickets yet.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {attendees.map((row) => (
            <li key={row.ticketId} className="p-3">
              <p className="font-medium">
                {row.attendee}
                {/* Idea for later: a tick once the attendee is checked in (needs checkedInAt in the query). */}
                {/* {row.checkedInAt && <span title="Checked in">✓</span>} */}
              </p>
              <p className="text-muted-foreground">
                {row.eventTitle} · {row.ticketType}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
