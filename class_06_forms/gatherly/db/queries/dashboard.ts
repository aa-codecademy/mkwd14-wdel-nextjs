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
import { desc, eq } from 'drizzle-orm';
import { db } from '..';
import { events } from '../schema';

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
