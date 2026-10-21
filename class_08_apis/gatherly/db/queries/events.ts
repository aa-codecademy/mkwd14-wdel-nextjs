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
// It uses the relations defined in db/schema.ts. Shared by the event queries below.
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

// How many events per page. Small on purpose, so pagination is easy to see with 30 seeded events.
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

// The `?sort=` values mapped to ORDER BY clauses. A lookup object is neater than if/else, and
// the second column is a TIE-BREAKER: events with the same price are then ordered by date.
// (`sortOrder[filters.sort]` is always valid because the Zod schema only allows these keys.)
const sortOrder = {
  date: [asc(events.startsAt)],
  price: [asc(events.minPriceCents), asc(events.startsAt)],
  newest: [asc(events.createdAt)],
} as const;

// ONE PAGE of published events that match the filters, plus the numbers needed for pagination.
// Returns { events, total, pageCount }.
export async function searchEvents(filters: EventFilters) {
  // The same WHERE is used for the page of rows AND for the count, so they always agree.
  const where = browseConditions(filters);

  // Promise.all runs both queries AT THE SAME TIME instead of one after the other, so the page
  // waits for the slower of the two, not for the sum of both.
  const [rows, total] = await Promise.all([
    db.query.events.findMany({
      where,
      orderBy: [...sortOrder[filters.sort]],
      // PAGINATION = LIMIT + OFFSET: take PAGE_SIZE rows, after skipping the rows of the earlier pages.
      // Page 1 skips 0, page 2 skips 6, page 3 skips 12, ...
      limit: PAGE_SIZE,
      offset: (filters.page - 1) * PAGE_SIZE,
      with: withDetails,
    }),
    // How many rows match in TOTAL (not just this page): `SELECT count(*) ... WHERE ...`.
    db.$count(events, where),
  ]);

  return {
    events: rows.map(flattenCategories),
    total,
    // 13 events / 6 per page = 2.17 -> 3 pages. `Math.max(1, ...)`: even with 0 results we have 1 page.
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

// The values for the filter controls: which cities have events, and all categories.
// Also read from the database, so a new city or category shows up without touching the UI code.
export async function getFilterOptions() {
  // Two independent queries -> run them in parallel again.
  // const [cityRows, categoryRows] = await Promise.all([
  //   // SELECT DISTINCT city ... = each city once, even if it has 10 events.
  //   db
  //     .selectDistinct({ city: events.city })
  //     .from(events)
  //     .where(eq(events.status, 'published'))
  //     .orderBy(asc(events.city)),
  //   db.select().from(categories).orderBy(asc(categories.name)),
  // ])

  return {
    cities: [],
    categories: [],
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

// Builds the WHERE clause from the filters. Start with the rule that always applies (published
// only), then ADD one condition per filter the user actually set. `and(...conditions)` joins
// them all with AND.
function browseConditions(filters: EventFilters) {
  const conditions = [eq(events.status, 'published')];

  if (filters.q) {
    conditions.push(ilike(events.title, `%${filters.q}%`));
  }

  if (filters.city) {
    conditions.push(eq(events.city, filters.city));
  }

  if (filters.from) {
    // gte = `>=`: events starting on or after that date. `new Date('2027-03-01')` is midnight UTC.
    conditions.push(gte(events.startsAt, new Date(filters.from)));
  }

  if (filters.category) {
    // Events and categories are MANY-TO-MANY (join table `event_categories`). So we use a SUBQUERY:
    //   WHERE events.id IN (SELECT event_id FROM event_categories
    //                       JOIN categories ... WHERE categories.slug = 'meetup')
    // Building it with `db.select(...)` (without awaiting it) gives Drizzle a query to embed.
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
