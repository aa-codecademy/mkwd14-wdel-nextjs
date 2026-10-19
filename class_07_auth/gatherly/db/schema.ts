/**
 * DATABASE SCHEMA — the single source of truth for our tables.
 *
 * We describe the tables in TypeScript. Drizzle then does three jobs from this file:
 *   1. `npm run db:generate` compares it with the previous state and WRITES a SQL
 *      migration into drizzle/ (CREATE TABLE, ALTER TABLE, ...).
 *   2. `npm run db:migrate` RUNS those SQL files against PostgreSQL.
 *   3. The types at the bottom (`$inferSelect`) give us TypeScript types that always
 *      match the tables, so a column rename shows up as a compile error, not a runtime bug.
 *
 * Mapping to the Gatherly domain:
 *   users ──< events >── venues          events belong to ONE organizer (user) and ONE venue
 *   events >──< categories               an event has MANY categories, a category MANY events
 *                                        (the join table is `event_categories`)
 *
 * Column names: we write camelCase in TypeScript (`startsAt`) and Drizzle stores
 * snake_case in PostgreSQL (`starts_at`). That's the `casing: 'snake_case'` option, which
 * must be set in BOTH drizzle.config.ts (generating SQL) and db/index.ts (running queries).
 */
import { relations } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
// The auth tables live in their own file (db/auth-schema.ts). Our app tables point at `user` below.
// The old `users` table of classes 3-6 is GONE: Better Auth's `user` table replaced it (migration 0004).
import { user } from './auth-schema';

// A PostgreSQL ENUM: a column that can only hold one of these values. The database itself
// rejects anything else. Heads-up: the spelling here is 'cancelled' (two l's), while the
// older types/event-status.ts used 'canceled'. The database spelling is the one that counts.
export const eventStatus = pgEnum('event_status', ['draft', 'published', 'cancelled']);
// The lifecycle of an ORDER. Heads-up on spelling: events use 'cancelled' (two l's) but orders use
// 'canceled' (one l). Both are valid English, and mixing them is an easy typo trap, so copy them
// exactly when you write code that compares or inserts these values.
export const orderStatus = pgEnum('order_status', ['pending', 'paid', 'refunded', 'canceled']);

export const categories = pgTable('categories', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().notNull(),
  slug: text().notNull().unique(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const venues = pgTable('venues', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().notNull(),
  address: varchar().notNull(),
  city: varchar().notNull(),
  country: varchar().notNull(),
  // integer() = whole numbers only.
  capacity: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable('events', {
  id: uuid().primaryKey().defaultRandom(),
  // URL-friendly unique name, used later in /events/[slug].
  slug: text().notNull().unique(),
  title: varchar().notNull(),
  description: varchar().notNull(),
  // No `.notNull()` -> nullable: the TS type is `string | null`. That's why types/gatherly-event.ts
  // overrides it with a plain `string` (the card always needs an image).
  coverImageUrl: text(),
  startsAt: timestamp({ withTimezone: true }).notNull(),
  endsAt: timestamp({ withTimezone: true }).notNull(),
  // New events start as 'draft' unless we say otherwise.
  status: eventStatus().notNull().default('draft'),
  city: varchar().notNull(),
  // Money as whole cents (4900 = 49.00): integers don't suffer from floating-point rounding.
  minPriceCents: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),

  // FOREIGN KEYS — a column that points at a row in another table.
  // `.references(() => venues.id)` makes PostgreSQL enforce it: you can't create an event for a
  // venue that doesn't exist, and (no onDelete rule = "no action") you can't delete a venue that
  // still has events. The arrow function `() =>` is lazy, so table order in this file doesn't matter.
  venueId: uuid()
    .notNull()
    .references(() => venues.id),
  // Now `text` and pointing at the auth `user` table (it was a uuid pointing at `users`): Better Auth's
  // ids are strings. Same idea as before: the event's owner. This is what AUTHORIZATION checks compare
  // against ("is this event mine?").
  organizerId: text()
    .notNull()
    .references(() => user.id),
});

// JOIN TABLE for the many-to-many link between events and categories. One row = one pair.
// Instead of an `id` column it uses a COMPOSITE primary key (eventId + categoryId), which also
// guarantees the same pair can't be stored twice.
export const eventCategories = pgTable(
  'event_categories',
  {
    eventId: uuid()
      .notNull()
      // `cascade`: deleting an event automatically deletes its rows here (no orphans left behind).
      .references(() => events.id, { onDelete: 'cascade' }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.categoryId] })],
);

// ───────────────────────── TICKETING (the groundwork for reserving tickets) ─────────────────────────
// An event sells one or more KINDS of ticket (e.g. "Standard", "VIP"). When someone buys, we create an
// ORDER (who bought, for which event, how much), and one TICKET row per seat in that order:
//
//   events ──< ticket_types          what you can buy, its price and how many exist
//   users  ──< orders >── events     one purchase by one user for one event
//   orders ──< tickets >── ticket_types   the individual tickets, each with its own code
//
// The migration drizzle/0003_*.sql creates these three tables (+ the order_status type). Nothing
// reads or writes them yet. The "New event" form even collects a ticket quantity that isn't saved.
// They're here so the next features (reserving tickets, the QR-code check-in) have somewhere to go.
export const ticketTypes = pgTable('ticket_types', {
  id: uuid().primaryKey().defaultRandom(),
  eventId: uuid()
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  name: varchar().notNull(),
  // Whole cents, like events.minPriceCents.
  priceCents: integer().notNull(),
  // How many tickets of this type exist in total.
  quantity: integer().notNull(),
});

// One purchase. Note the foreign keys have no `onDelete` rule (default = no action): you can't delete
// a user or an event that has orders. That protects the sales history.
export const orders = pgTable('orders', {
  id: uuid().primaryKey().defaultRandom(),
  // Who bought the order: also an auth `user` id now (text).
  userId: text()
    .notNull()
    .references(() => user.id),
  eventId: uuid()
    .notNull()
    .references(() => events.id),
  status: orderStatus().notNull().default('pending'),
  // The order's total in cents. (A naming nit: elsewhere we say `...Cents`, plural.)
  totalCent: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// One ticket = one admission. `onDelete: 'cascade'` on orderId: if an order is deleted, its tickets go
// with it. Deleting a ticket TYPE that has tickets is blocked (no action).
export const tickets = pgTable('tickets', {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid()
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  ticketTypeId: uuid()
    .notNull()
    .references(() => ticketTypes.id),
  // The value the QR code will carry. UNIQUE, so no two tickets can ever have the same code.
  code: text().notNull().unique(),
  attendeeName: text().notNull(),
});

// RELATIONS — tell Drizzle how tables connect, so we can load related rows in ONE query:
//   db.query.events.findMany({ with: { venue: true, organizer: true } })
// This is only for Drizzle's query API. It does NOT change the database. The real constraints
// are the `.references(...)` calls above. `one()` = this row points to one other row (via the
// foreign key); `many()` = other rows point back to this one.

export const venuesRelations = relations(venues, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  venue: one(venues, { fields: [events.venueId], references: [venues.id] }),
  organizer: one(user, { fields: [events.organizerId], references: [user.id] }),
  eventCategories: many(eventCategories),
  // New: an event has many ticket types, so `with: { ticketTypes: true }` works in queries.
  ticketTypes: many(ticketTypes),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  eventCategories: many(eventCategories),
}));

// NEW in class 04: the relations of the JOIN table. They let a query go from an event to its
// categories (events -> eventCategories -> category), which `db/queries/events.ts` needs for
// `with: { eventCategories: { with: { category: true } } }`. Without them Drizzle wouldn't
// know how to load `category` through `eventCategories`.
export const eventCategoriesRelations = relations(eventCategories, ({ one }) => ({
  event: one(events, { fields: [eventCategories.eventId], references: [events.id] }),
  category: one(categories, { fields: [eventCategories.categoryId], references: [categories.id] }),
}));

export const ticketTypesRelations = relations(ticketTypes, ({ one, many }) => ({
  event: one(events, { fields: [ticketTypes.eventId], references: [events.id] }),
  tickets: many(tickets),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  event: one(events, { fields: [orders.eventId], references: [events.id] }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  order: one(orders, { fields: [tickets.orderId], references: [orders.id] }),
  ticketType: one(ticketTypes, { fields: [tickets.ticketTypeId], references: [ticketTypes.id] }),
}));

// TYPES inferred from the tables above. `$inferSelect` = the shape of a row we READ.
// (`$inferInsert` would be the shape we pass when INSERTing; columns with defaults become optional.)
// Change a column above and every place that uses these types updates automatically.
export type Category = typeof categories.$inferSelect;
export type Venue = typeof venues.$inferSelect;
// Renamed in class 04 (it was `Event`): this is the type of a plain `events` ROW.
// Heads-up: types/gatherly-event.ts and mocks/mock-events.ts still import the old name
// `Event`, which is why `npm run typecheck` reports errors. They're unused leftovers now.
export type GatherlyEvent = typeof events.$inferSelect;

export type TicketType = typeof ticketTypes.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;

// `enumValues` is the array of an enum's values; indexing it with [number] gives their UNION:
// 'draft' | 'published' | 'cancelled'. So the type follows the enum automatically.
export type EventStatus = (typeof eventStatus.enumValues)[number];
export type OrderStatus = (typeof orderStatus.enumValues)[number];
