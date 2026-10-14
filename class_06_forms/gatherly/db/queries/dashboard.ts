import { desc, eq } from 'drizzle-orm';
import { db } from '..';
import { events } from '../schema';

export async function getOrganizerEvents(organizerId: string) {
  return db.query.events.findMany({
    // where: eq(events.organizerId, organizerId), // TODO: Implement after Auth
    orderBy: desc(events.createdAt),
    columns: { id: true, slug: true, title: true, startsAt: true, status: true, city: true },
  });
}
