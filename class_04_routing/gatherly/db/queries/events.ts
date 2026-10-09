/**
 * QUERIES for events — the ONLY place pages ask the database for events.
 *
 * Pages and components call these functions (`searchEvents(filters)`) and don't know about
 * SQL or Drizzle. That keeps queries easy to find, reuse and change in one place. For example,
 * "only published events" is written here, not repeated in every page.
 *
 * Every query returns an event TOGETHER with its venue, categories and organizer.
 */
// Build error if a Client Component ever imports this file (the database stays on the server).
import 'server-only';

import { db } from '@/db';
// Drizzle's filter helpers become SQL: eq = `=`, and = `AND`, ilike = `ILIKE` (case-insensitive
// LIKE), asc = `ORDER BY ... ASC`.
import { and, asc, eq, ilike } from 'drizzle-orm';
import { events } from '../schema';
import type { EventFilters } from '../../lib/event-filters';

// What to load together with each event (the `with` option of Drizzle's relational queries).
// It uses the relations defined in db/schema.ts. Shared by all three queries below.
//   venue            -> the whole venue row
//   eventCategories  -> the join table. `columns: {}` = "don't select any join-table columns,
//                       I only want the `category` behind each row".
//   organizer        -> ONLY id, name and handle. We never load the organizer's email or role
//                       for a public page, so they can't leak by accident.
// `as const` keeps the exact shape, so TypeScript can infer the result type precisely.
const withDetails = {
  venue: true,
  eventCategories: { columns: {}, with: { category: true } },
  organizer: { columns: { id: true, name: true, handle: true } },
} as const;

// All published events, soonest first. (Today it's only used to derive the EventWithDetails type.)
export async function getPublishedEvents() {
  const rows = await db.query.events.findMany({
    // Drafts and cancelled events must never show up on public pages.
    where: eq(events.status, 'published'),
    orderBy: asc(events.startsAt),
    // A safety cap. Without it a huge table would load every row. Real pagination comes later.
    limit: 50,
    with: withDetails,
  });

  return rows.map(flattenCategories);
}

// Published events, optionally filtered by a title search (?q=).
export async function searchEvents(filters: EventFilters) {
  // Build the WHERE clause: without a search -> `status = 'published'`.
  // With a search -> `status = 'published' AND title ILIKE '%text%'` (contains, any letter case).
  // The user's text goes to PostgreSQL as a PARAMETER, never glued into the SQL string, so
  // this is safe from SQL injection. (`%` and `_` typed by the user act as wildcards in LIKE,
  // which is harmless here, just good to know.)
  const where = filters.q
    ? and(eq(events.status, 'published'), ilike(events.title, `%${filters.q}%`))
    : eq(events.status, 'published');

  const rows = await db.query.events.findMany({
    where,
    orderBy: asc(events.startsAt),
    limit: 50,
    with: withDetails,
  });

  return rows.map(flattenCategories);
}

// ONE event for the details page, or `undefined` if there is none (or it isn't published).
// `findFirst` returns a single row instead of an array. The page turns `undefined` into a 404.
export async function getEventBySlug(slug: string) {
  const row = await db.query.events.findFirst({
    where: and(eq(events.slug, slug), eq(events.status, 'published')),
    with: withDetails,
  });

  // `row && ...` -> if there's no row, return it as is (undefined); otherwise reshape it.
  return row && flattenCategories(row);
}

// The database gives categories as [{ category: {...} }, ...] (rows of the join table).
// The UI wants a plain `categories: [{...}, ...]`, so we unwrap it. Generics (<Row, Category>)
// make this work for any row shape while keeping the result typed.
function flattenCategories<Row, Category>(
  row: Row & { eventCategories: { category: Category }[] },
) {
  const { eventCategories, ...event } = row;

  return { ...event, categories: eventCategories.map((ec) => ec.category) };
}

// The TYPE of one event as our pages receive it, INFERRED from the query above. No hand-written
// type to keep in sync: change `withDetails` and this type changes with it.
// (Awaited<ReturnType<...>> = "the thing the async function resolves to"; [number] = one array item.)
export type EventWithDetails = Awaited<ReturnType<typeof getPublishedEvents>>[number];
