/**
 * QUERIES for the organizer dashboard — the events an organizer manages.
 *
 * Unlike the public queries (db/queries/events.ts), this one is NOT limited to published events:
 * an organizer must see their drafts too. That's why the dashboard has its own query file.
 *
 * ⚠️ Work in progress: nobody is signed in yet, so we can't know WHICH organizer is asking.
 * Today it returns the events of EVERYONE, and the `where` that would limit it to one
 * organizer is commented out until authentication exists. Never ship a version like this:
 * a real dashboard must only return the signed-in organizer's own events.
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
