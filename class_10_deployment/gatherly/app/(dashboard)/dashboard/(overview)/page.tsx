/**
 * ROUTE: /dashboard   — the main part (`children`) of the organizer overview.
 *
 * It sits inside the layout next to the parallel slots (see layout.tsx): the number tiles, recent
 * orders and attendees come from `@stats`, `@orders` and `@attendees`, and THIS page renders the
 * list of the organizer's events below them.
 *
 *   const organizer = await requireOrganizer('/dashboard');
 *
 * That first line is the guard (lib/session.ts), explained in the class 07 README:
 *   not signed in           -> redirect to /sign-in?next=/dashboard
 *   signed in, attendee     -> redirect to /organizers-only
 *   signed in, organizer    -> carries on, and returns the user, so we can use `organizer.id`
 *
 * What is real and what is still a placeholder:
 *   ✅ the page is only for organizers and admins
 *   ✅ the list is limited to THIS organizer's events (getOrganizerEvents filters by owner now, so
 *      the data leak of class 7 is closed)
 *   ✅ "New event" opens a real form (app/actions/events.ts)
 *   🚧 "Signed in as JohnDoe" is still hard-coded: it should print `organizer.name`
 *   🚧 <form action=""> around Publish/Unpublish does nothing yet. A Server Action goes there,
 *      and it must check that the event BELONGS to the signed-in organizer.
 *
 * It lives in the `(overview)` route group, so the URL is still just /dashboard.
 */
import Link from 'next/link';
// `buttonVariants` gives a <Link> the LOOK of a button (see components/ui/button.tsx):
// it navigates, so it must be a link, not a <button>.
import { Button, buttonVariants } from '../../../../components/ui/button';
import { formatEventDate } from '../../../../lib/format';
import { Badge } from '../../../../components/ui/badge';
import { getOrganizerEvents } from '../../../../db/queries/dashboard';
import { requireOrganizer } from '../../../../lib/session';

export default async function DashboardPage() {
  // The guard. Everything below runs only for a signed-in organizer or admin.
  const organizer = await requireOrganizer('/dashboard');
  const events = await getOrganizerEvents(organizer.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Your events</h1>
          <p className="text-sm text-muted-foreground">Signed in as JohnDoe</p>
        </div>
        <Link href="/dashboard/events/new" className={buttonVariants()}>
          New event
        </Link>
      </div>
      <ul className="mt-6 divide-y divide-border rounded-card border border-border bg-background">
        {events.map((event) => {
          // Computed once per row and reused below: no extra state needed.
          const isPublished = event.status === 'published';

          return (
            <li key={event.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-medium">
                  {/* Only PUBLISHED events have a public page. A draft's /events/<slug> would be a 404. */}
                  {isPublished ? (
                    <Link href={`/events/${event.slug}`} className="hover:underline">
                      {event.title}
                    </Link>
                  ) : (
                    event.title
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatEventDate(event.startsAt)} | {event.city}
                </p>
              </div>
              {/* Filled badge for published, softer one for everything else. */}
              <Badge variant={isPublished ? 'default' : 'secondary'}>{event.status}</Badge>
              {/* Placeholder form (see the notes at the top of the file). */}
              <form action="">
                <Button variant="outline" size="sm" type="submit">
                  {isPublished ? 'Unpublish' : 'Publish'}
                </Button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
