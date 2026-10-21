/**
 * QUERIES for the organizer dashboard — the events an organizer manages.
 *
 * Unlike the public queries (db/queries/events.ts), this one is NOT limited to published events:
 * an organizer must see their drafts too. That's why the dashboard has its own query file.
 *
 * ⚠️ AUTHORIZATION GAP: the dashboard page now passes the signed-in organizer's id, but
 * `getOrganizerEvents` still IGNORES it: the `where` that would limit the list to that
 * organizer is commented out. So every organizer sees EVERY organizer's events, drafts included.
 * That's a data leak ("broken access control", the #1 web security risk). The fix is to
 * restore the `where` (it's one line) and test it with two organizers.
 *
 * The rule to remember: authentication gets you IN, but every query that returns or changes
 * user-owned data must also filter by the owner.
 */
// Heads-up: `eq` isn't used yet (it belongs to the commented-out `where` below), and ESLint reports it.
import { desc, eq, asc } from 'drizzle-orm';
import { db } from '..';
import { categories, events, venues } from '../schema';

// `organizerId` is accepted already (the app will pass the signed-in user's id), but it isn't
// used yet, which is why ESLint reports it as an unused argument.
export async function getOrganizerEvents(organizerId: string) {
  return db.query.events.findMany({
    // where: eq(events.organizerId, organizerId), // TODO: Implement after Auth
    // Newest first: what the organizer just created is at the top.
    orderBy: desc(events.createdAt),
    // Select ONLY the columns the list shows, not the whole row (no description, no price, ...).
    columns: { id: true, slug: true, title: true, startsAt: true, status: true, city: true },
  });
}

// What the "New event" form needs: every venue and category, to build the <select> and the
// checkboxes. Only the columns the form uses (id to submit, name to show, city for the label).
// The two queries don't depend on each other, so they run in parallel with Promise.all.
export async function getEventFormOptions() {
  const [venueRows, categoryRows] = await Promise.all([
    db
      .select({
        id: venues.id,
        name: venues.name,
        city: venues.city,
      })
      .from(venues)
      // Alphabetical, so the dropdown is easy to scan.
      .orderBy(asc(venues.name)),
    db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .orderBy(asc(categories.name)),
  ]);

  return {
    venues: venueRows,
    categories: categoryRows,
  };
}
