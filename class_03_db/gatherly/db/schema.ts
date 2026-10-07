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

export const eventStatus = pgEnum('event_status', ['draft', 'published', 'cancelled']);

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar().notNull(),
  email: text().notNull().unique(),
  handle: text().notNull().unique(),
  role: text().notNull().default('attendee'),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

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
  capacity: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable('events', {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  title: varchar().notNull(),
  description: varchar().notNull(),
  coverImageUrl: text(),
  startsAt: timestamp({ withTimezone: true }).notNull(),
  endsAt: timestamp({ withTimezone: true }).notNull(),
  status: eventStatus().notNull().default('draft'),
  city: varchar().notNull(),
  minPriceCents: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),

  // Relations
  venueId: uuid()
    .notNull()
    .references(() => venues.id),
  organizerId: uuid()
    .notNull()
    .references(() => users.id),
});

export const eventCategories = pgTable(
  'event_categories',
  {
    eventId: uuid()
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.categoryId] })],
);

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
}));

export const venuesRelations = relations(venues, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  venue: one(venues, { fields: [events.venueId], references: [venues.id] }),
  organizer: one(users, { fields: [events.organizerId], references: [users.id] }),
  eventCategories: many(eventCategories),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  eventCategories: many(eventCategories),
}));

// Types

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Event = typeof events.$inferSelect;
