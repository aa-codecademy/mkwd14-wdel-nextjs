import { getRecentAttendees } from '../../../../../db/queries/dashboard';
import { requireOrganizer } from '../../../../../lib/session';

export default async function AttendeesSlot() {
  const organizer = await requireOrganizer('/dashboard');
  const attendees = await getRecentAttendees(organizer.id);

  return (
    <div className="rounded-card border border-border bg-background">
      <h2 className="border-b border-border p-3 font-semibold">Attendees</h2>
      {attendees.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">No paid tickets yet.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {attendees.map((row) => (
            <li key={row.ticketId} className="p-3">
              <p className="font-medium">
								{row.attendee}
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
