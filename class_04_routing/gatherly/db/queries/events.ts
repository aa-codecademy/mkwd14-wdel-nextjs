import 'server-only';

import { db } from '@/db';
import { and, asc, eq, ilike } from 'drizzle-orm';
import { events } from '../schema';
import type { EventFilters } from '../../lib/event-filters';

const withDetails = {
  venue: true,
  eventCategories: { columns: {}, with: { category: true } },
  organizer: { columns: { id: true, name: true, handle: true } },
} as const;

export async function getPublishedEvents() {
  const rows = await db.query.events.findMany({
    where: eq(events.status, 'published'),
    orderBy: asc(events.startsAt),
    limit: 50,
    with: withDetails,
  });

  return rows.map(flattenCategories);
}

export async function searchEvents(filters: EventFilters) {
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

export async function getEventBySlug(slug: string) {
  const row = await db.query.events.findFirst({
    where: and(eq(events.slug, slug), eq(events.status, 'published')),
    with: withDetails,
  });

  return row && flattenCategories(row);
}

function flattenCategories<Row, Category>(
  row: Row & { eventCategories: { category: Category }[] },
) {
  const { eventCategories, ...event } = row;

  return { ...event, categories: eventCategories.map((ec) => ec.category) };
}

export type EventWithDetails = Awaited<ReturnType<typeof getPublishedEvents>>[number];
