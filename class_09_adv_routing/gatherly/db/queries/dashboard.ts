/**
 * QUERIES for the organizer dashboard — everything an organizer sees about THEIR events.
 *
 * Unlike the public queries (db/queries/events.ts), these are NOT limited to published events: an organizer
 * must see their drafts too. That's why the dashboard has its own query file.
 *
 * ✅ The authorization rule, applied in EVERY query below: filter by the OWNER. `events.organizerId =
 * <the signed-in user's id>` is in each `where`. The id comes from the session (the page calls
 * requireOrganizer and passes `organizer.id`), never from the URL or a form. This is what stops one organizer from
 * reading another's events, orders or attendees ("broken access control", the #1 web security risk).
 * (In class 7 `getOrganizerEvents` ignored it. It's fixed now.)
 *
 * Several of these feed the PARALLEL ROUTE panels of the dashboard (app/(dashboard)/dashboard/(overview)/@...):
 * getOrganizerStats -> @stats, getRecentOrders -> @orders, getRecentAttendees -> @attendees.
 */
// `and` joins conditions, `sql` is for raw SQL fragments the builder has no helper for (aggregates below).
import { desc, eq, asc, and, sql } from 'drizzle-orm';
import { db } from '..';
import { categories, events, orders, tickets, ticketTypes, venues } from '../schema';
// The auth `user` table: we join it to show the BUYER's name on an order.
import { user } from '../auth-schema';

// The organizer's own events, drafts included. `organizerId` MUST be the signed-in user's id.
export async function getOrganizerEvents(organizerId: string) {
  return db.query.events.findMany({
    // The ownership filter: only rows that belong to this organizer.
    where: eq(events.organizerId, organizerId),
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

// The latest people with a PAID ticket for this organizer's events (feeds the @attendees panel).
// Path: ticket -> its ticket type -> its event, and ticket -> its order. A ticket doesn't know its event
// directly, so we JOIN through ticket_types. `limit = 10` is a default parameter: a panel needs a handful, not all.
export async function getRecentAttendees(organizerId: string, limit = 10) {
  return db
    .select({
      ticketId: tickets.id,
      attendee: tickets.attendeeName,
      eventTitle: events.title,
      ticketType: ticketTypes.name,
    })
    .from(tickets)
    .innerJoin(ticketTypes, eq(ticketTypes.id, tickets.ticketTypeId))
    .innerJoin(events, eq(events.id, ticketTypes.eventId))
    .innerJoin(orders, eq(orders.id, tickets.orderId))
    // Owner AND paid: someone with an unpaid reservation isn't an attendee yet.
    .where(and(eq(events.organizerId, organizerId), eq(orders.status, 'paid')))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

// The latest orders on this organizer's events, with the buyer's name (feeds the @orders panel).
export async function getRecentOrders(organizerId: string, limit = 10) {
  return db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      status: orders.status,
      // Renamed on the way out: the column is `totalCent` (singular), the panel reads `totalCents`.
      totalCents: orders.totalCent,
      eventTitle: events.title,
      buyer: user.name,
    })
    .from(orders)
    .innerJoin(events, eq(events.id, orders.eventId))
    // INNER JOIN: an order always has a buyer and an event, so no rows are lost.
    .innerJoin(user, eq(user.id, orders.userId))
    .where(eq(events.organizerId, organizerId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

// The numbers for the tiles on top of the dashboard (feeds the @stats panel): how many events are published or
// drafts, how many tickets are paid or pending, and the revenue.
//
// A new SQL tool here: `count(*) FILTER (WHERE condition)` counts only the rows matching the condition, so ONE
// query can produce several counts at once (published AND drafts) instead of running one query per number.
// `.mapWith(Number)` converts PostgreSQL's bigint count, which node-postgres returns as a string, to a number.
export async function getOrganizerStats(organizerId: string) {
  // Independent queries run in PARALLEL (Promise.all): the panel waits for the slowest, not for the sum.
  const [eventCounts, ticketCounts] = await Promise.all([
    db
      .select({
        published: sql<number>`count(*) filter (where ${events.status} = 'published')`.mapWith(
          Number,
        ),
        drafts: sql<number>`count(*) filter (where ${events.status} = 'draft')`.mapWith(Number),
      })
      .from(events)
      .where(eq(events.organizerId, organizerId)),
    db
      .select({
        paidTickets:
          sql<number>`count(${tickets.id}) filter (where ${orders.status} = 'paid')`.mapWith(
            Number,
          ),
        pendingTickets:
          sql<number>`count(${tickets.id}) filter (where ${orders.status} = 'pending')`.mapWith(
            Number,
          ),
        // Commented out: counting check-ins needs a check-in table that doesn't exist yet.
        // checkedIn: sql<number>`count(${checkIns.id})`.mapWith(Number),
      })
      .from(tickets)
      .innerJoin(orders, eq(orders.id, tickets.orderId))
      .innerJoin(events, eq(events.id, orders.eventId))
      // .leftJoin(checkIns, eq(checkIns.ticketId, tickets.id))
      .where(eq(events.organizerId, organizerId)),
  ]);

  // Revenue: the sum of PAID orders. `coalesce(sum(...), 0)`: SUM of no rows is NULL in SQL, and coalesce turns
  // that NULL into 0, so an organizer with no sales sees 0 instead of nothing.
  const [revenue] = await db
    .select({
      cents: sql<number>`coalesce(sum(${orders.totalCent}), 0)`.mapWith(Number),
    })
    .from(orders)
    .innerJoin(events, eq(events.id, orders.eventId))
    .where(and(eq(events.organizerId, organizerId), eq(orders.status, 'paid')));

  // Merge the three small results into one object. `eventCounts[0]` is the single aggregate row (an aggregate
  // without GROUP BY always returns exactly one row). `?.` and `?? 0` because noUncheckedIndexedAccess says
  // an array element may be undefined.
  return {
    ...eventCounts[0],
    ...ticketCounts[0],
    revenueCents: revenue?.cents ?? 0,
  };
}
