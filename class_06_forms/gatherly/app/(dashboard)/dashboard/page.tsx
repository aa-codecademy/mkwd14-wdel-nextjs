/**
 * ROUTE: /dashboard   — the organizer's list of their events.
 *
 * A Server Component that reads the database directly (`await getOrganizerEvents(...)`),
 * wrapped by the sidebar layout of the (dashboard) route group.
 *
 * What is real and what is a placeholder in this version:
 *   ✅ the list of events, newest first, with a status badge (draft / published / cancelled)
 *   ✅ "New event" opens /dashboard/events/new, a real form handled by a Server Action
 *      (see app/actions/events.ts). After it succeeds you land back here and the new draft is
 *      at the top. That's what `revalidatePath('/dashboard')` + `redirect('/dashboard')` do.
 *   🚧 "Signed in as JohnDoe" is hard-coded text. There is no sign-in yet.
 *   🚧 getOrganizerEvents('') receives an empty id and returns ALL events (see the query file).
 *   🚧 <form action=""> around the Publish/Unpublish button: a form whose action does nothing
 *      yet. It marks where a SECOND Server Action (one that changes an event's status) plugs in.
 *      Clicking it just reloads the page.
 *
 * Rendering note: this page uses nothing from the request (no cookies, headers or search
 * params), so `next build` could prerender it ONCE with the data of that moment. `npm run dev`
 * always renders fresh. A real dashboard reads the signed-in user (cookies), which makes it
 * dynamic automatically. This is also why the create action calls `revalidatePath`.
 */
import Link from 'next/link';
// `buttonVariants` gives a <Link> the LOOK of a button (see components/ui/button.tsx):
// it navigates, so it must be a link, not a <button>.
import { Button, buttonVariants } from '../../../components/ui/button';
import { formatEventDate } from '../../../lib/format';
import { Badge } from '../../../components/ui/badge';
import { getOrganizerEvents } from '../../../db/queries/dashboard';

export default async function DashboardPage() {
  // Placeholder: '' until we know who is signed in.
  const events = await getOrganizerEvents('');

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
