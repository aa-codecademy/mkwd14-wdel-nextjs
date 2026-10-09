import 'server-only';

import { db } from '@/db';
import { asc, eq } from 'drizzle-orm';
import { events } from '../schema';

export async function getPublishedEvents() {
  const rows = await db.query.events.findMany({
    where: eq(events.status, 'published'),
    orderBy: asc(events.startsAt),
    limit: 50,
  });

  return rows;
}
