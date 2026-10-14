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
import { and, asc, eq, gte, ilike, inArray } from 'drizzle-orm';
import { categories, eventCategories, events } from '../schema';
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

export const PAGE_SIZE = 6;

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

const sortOrder = {
  date: [asc(events.startsAt)],
  price: [asc(events.minPriceCents), asc(events.startsAt)],
  newest: [asc(events.createdAt)],
} as const;

// Published events, optionally filtered by a title search (?q=).
export async function searchEvents(filters: EventFilters) {
  const where = browseConditions(filters);

  const [rows, total] = await Promise.all([
    db.query.events.findMany({
      where,
      orderBy: [...sortOrder[filters.sort]],
      limit: PAGE_SIZE,
      offset: (filters.page - 1) * PAGE_SIZE,
      with: withDetails,
    }),
    db.$count(events, where),
  ]);

  return {
    events: rows.map(flattenCategories),
    total,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
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

export async function getFilterOptions() {
  const [cityRows, categoryRows] = await Promise.all([
    db
      .selectDistinct({ city: events.city })
      .from(events)
      .where(eq(events.status, 'published'))
      .orderBy(asc(events.city)),
    db.select().from(categories).orderBy(asc(categories.name)),
  ]);

  return {
    cities: cityRows.map((row) => row.city),
    categories: categoryRows,
  };
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

function browseConditions(filters: EventFilters) {
  const conditions = [eq(events.status, 'published')];

  if (filters.q) {
    conditions.push(ilike(events.title, `%${filters.q}%`));
  }

  if (filters.city) {
    conditions.push(eq(events.city, filters.city));
  }

  if (filters.from) {
    conditions.push(gte(events.startsAt, new Date(filters.from)));
  }

  if (filters.category) {
    const inCategory = db
      .select({ id: eventCategories.eventId })
      .from(eventCategories)
      .innerJoin(categories, eq(categories.id, eventCategories.categoryId))
      .where(eq(categories.slug, filters.category));

    conditions.push(inArray(events.id, inCategory));
  }

  return and(...conditions);
}

// The TYPE of one event as our pages receive it, INFERRED from the query above. No hand-written
// type to keep in sync: change `withDetails` and this type changes with it.
// (Awaited<ReturnType<...>> = "the thing the async function resolves to"; [number] = one array item.)
export type EventWithDetails = Awaited<ReturnType<typeof getPublishedEvents>>[number];
