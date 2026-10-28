/**
 * ROUTE: /dashboard   — the organizer's list of their events.
 *
 * A Server Component, wrapped by the sidebar layout of the (dashboard) route group. Since class 7
 * it is PROTECTED:
 *
 *   const organizer = await requireOrganizer('/dashboard');
 *
 * That first line is the guard (lib/session.ts). It reads the session cookie, asks the database who
 * you are, and then:
 *   not signed in           -> redirect to /sign-in?next=/dashboard   (you come back after logging in)
 *   signed in, attendee     -> redirect to /organizers-only
 *   signed in, organizer    -> carries on, and returns the user, so we can use `organizer.id`
 * proxy.ts also bounces visitors without a cookie before the page runs, but that is only a quick
 * first filter. This line is the real lock.
 *
 * What is real and what is still a placeholder:
 *   ✅ the page is only for organizers and admins
 *   ✅ "New event" opens a real form (app/actions/events.ts)
 *   ✅ the list is limited to THIS organizer's events (getOrganizerEvents filters by owner)
 *   ✅ Publish/Unpublish call the setEventStatus Server Action, which checks ownership
 *   🚧 "Signed in as JohnDoe" is still hard-coded: it should print `organizer.name`
 *
 * NEW in class 10: a "Check-in scanner tokens" section at the bottom. An organizer creates a token
 * for a device (a tablet at the door); the device then calls the check-in API with it instead of a
 * login. See lib/api-tokens.ts and app/actions/api-tokens.ts. The stats panel also gained a
 * "Checked in" tile (see @stats/page.tsx).
 *
 * Because it reads the cookie (through requireOrganizer), the page is rendered on every request:
 * Next.js can't prerender something that depends on who is asking.
 */
import Link from 'next/link';
// `buttonVariants` gives a <Link> the LOOK of a button (see components/ui/button.tsx):
// it navigates, so it must be a link, not a <button>.
import { Button, buttonVariants } from '../../../../components/ui/button';
import { formatEventDate } from '../../../../lib/format';
import { Badge } from '../../../../components/ui/badge';
import { getApiTokens, getOrganizerEvents } from '../../../../db/queries/dashboard';
import { requireOrganizer } from '../../../../lib/session';
import { setEventStatus } from '../../../actions/events';
import CreateScannerToken from './_components/create-scanner-token';

export default async function DashboardPage() {
  // The guard. Everything below runs only for a signed-in organizer or admin.
  const organizer = await requireOrganizer('/dashboard');
  // The events and the tokens don't depend on each other, so they load in parallel with Promise.all
  // (not one after the other). Both queries filter by `organizer.id`: you only ever see your own rows.
  const [events, tokens] = await Promise.all([
    getOrganizerEvents(organizer.id),
    getApiTokens(organizer.id),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Your events</h1>
          {/* Placeholder: should be `organizer.name`. */}
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
              {/* A form whose `action` is a Server Action. `.bind(null, id, status)` pre-fills the arguments,
                  so the action receives (eventId, newStatus). Those values travel to the server like any
                  input, which is why setEventStatus re-validates them and checks the event is yours. */}
              <form
                action={setEventStatus.bind(null, event.id, isPublished ? 'draft' : 'published')}
              >
                <Button variant="outline" size="sm" type="submit">
                  {isPublished ? 'Unpublish' : 'Publish'}
                </Button>
              </form>
            </li>
          );
        })}
      </ul>

      {/* NEW: scanner API tokens. The token list comes from the server; the creation form is a
          Client Component (it needs useActionState to show the one-time token). */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-brand-900">Check-in scanner tokens</h2>
        <CreateScannerToken />
        {/* Only render the list if there is something to list. We select safe columns only: the
            query never returns tokenHash, and the plain token isn't stored anywhere to show. */}
        {tokens.length > 0 && (
          <ul className="mt-4 divide-y divide-border rounded-card border border-border text-sm">
            {tokens.map((token) => (
              <li key={token.id} className="flex justify-between gap-4 p-3">
                <span className="font-medium">{token.label}</span>
                <span className="text-muted-foreground">
                  {/* Status: revoked wins over last-used; a never-used token is a hint it may be forgotten. */}
                  {token.revokedAt
                    ? 'revoked'
                    : token.lastUsedAt
                      ? `last used ${formatEventDate(token.lastUsedAt)}`
                      : 'never used'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
