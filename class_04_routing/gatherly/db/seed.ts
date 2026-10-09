/**
 * SEED SCRIPT — fills the database with fake but realistic data.
 *
 *   npm run db:seed        (runs `tsx db/seed.ts`; the tables must exist: `npm run db:migrate`)
 *
 * Why seed? An empty database means empty pages. This gives every student the same kind of
 * data to build and test with: 15 users, 8 categories, 10 venues and 30 events.
 *
 * Things to know:
 * - The data is RANDOM (made with @faker-js/faker), so everybody gets different events.
 * - Statuses are random too (draft / published / cancelled), so only about a third of the
 *   events are 'published' and visible on the site. That's on purpose: it tests our filter.
 * - It ADDS rows every time you run it. To start over, empty the tables first (see the
 *   class 04 README, "Reset the data").
 * - It's a standalone Node script, NOT part of the Next.js app. That's why it builds its own
 *   database connection below instead of importing `db` from db/index.ts: that file imports
 *   'server-only', which throws an error outside of Next.js.
 */
// A script outside Next.js doesn't get `.env` loaded automatically, so we load it ourselves.
import { loadEnvConfig } from '@next/env';
// faker generates fake names, emails, sentences, dates, images, ...
import { faker } from '@faker-js/faker';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy from .env.example to .env to fill it out.');
}

const pool = new Pool({ connectionString });
const db = drizzle({
  client: pool,
  schema,
  casing: 'snake_case',
});

// `Array.from({ length: N }, (_, index) => ...)` builds an array of N generated items.
// Each helper below creates the plain objects (rows) we will INSERT.
const userRows = Array.from({ length: 15 }, (_, index) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    name: `${firstName} ${lastName}`,
    // email and handle are UNIQUE columns, so we add the index to make sure two fake users
    // can never get the same value.
    email: faker.internet.email({ firstName, lastName }).replace('@', `+${index}@`).toLowerCase(),
    handle: `${faker.internet.username().toLowerCase()}-${index}`,
    // The first 5 users are organizers. Events need an organizer, so this decides who can own events.
    role: index < 5 ? 'organizer' : 'attendee',
  };
});

const categoryRows = Array.from({ length: 8 }, (_, index) => {
  const name = faker.word.noun();

  return {
    name: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
    slug: `${faker.helpers.slugify(name).toLowerCase()}-${index + 1}`,
  };
});

const venueRows = Array.from({ length: 10 }, () => ({
  name: faker.company.name(),
  address: faker.location.streetAddress(),
  city: faker.location.city(),
  country: faker.location.country(),
  capacity: faker.number.int({ min: 50, max: 10_000 }),
}));

// Same values as the `event_status` enum in db/schema.ts. `as const` keeps them as exact
// literal types instead of plain `string`.
const eventStatuses = ['draft', 'published', 'cancelled'] as const;

// Events need real ids of organizers, categories and venues (foreign keys), so this runs AFTER
// those were inserted, and receives their ids.
const createEventRows = (
  organizerIds: string[],
  categoryIds: string[],
  venues: { id: string; city: string }[],
) =>
  Array.from({ length: 30 }, (_, index) => {
    const startsAt = faker.date.soon({ days: 365 });
    const venue = faker.helpers.arrayElement(venues);

    return {
      slug: `${faker.helpers.slugify(faker.lorem.words({ min: 3, max: 6 })).toLowerCase()}-${index + 1}`,
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      // Random placeholder images come from other hosts (e.g. picsum.photos), which is why
      // next.config.ts allows them in `images.remotePatterns`.
      coverImageUrl: faker.image.url(),
      startsAt,
      endsAt: new Date(startsAt.getTime() + faker.number.int({ min: 1, max: 8 }) * 60 * 60 * 1000),
      status: faker.helpers.arrayElement(eventStatuses),
      city: venue.city,
      minPriceCents: faker.number.int({ min: 0, max: 10_000 }),
      venueId: venue.id,
      organizerId: faker.helpers.arrayElement(organizerIds),
      // Not a column of `events`. It's used below to fill the join table, then removed.
      categoryIds: faker.helpers.arrayElements(categoryIds, { min: 1, max: 3 }),
    };
  });

async function seed() {
  try {
    // A TRANSACTION = all or nothing. If any insert fails, everything is rolled back, so we
    // never end up with half-filled tables.
    await db.transaction(async (tx) => {
      // ORDER MATTERS because of foreign keys: parents first (users, categories, venues),
      // then events (they point at users and venues), then event_categories (it points at
      // events and categories). `.returning(...)` gives back the ids PostgreSQL generated.
      const insertedUsers = await tx
        .insert(schema.users)
        .values(userRows)
        .returning({ id: schema.users.id, role: schema.users.role });
      const categories = await tx
        .insert(schema.categories)
        .values(categoryRows)
        .returning({ id: schema.categories.id });
      const venues = await tx
        .insert(schema.venues)
        .values(venueRows)
        .returning({ id: schema.venues.id, city: schema.venues.city });

      const organizerIds = insertedUsers
        .filter((user) => user.role === 'organizer')
        .map((user) => user.id);
      const eventRows = createEventRows(
        organizerIds,
        categories.map((category) => category.id),
        venues,
      );
      // Remove the helper field `categoryIds` before inserting (the underscore prefix tells
      // ESLint "unused on purpose").
      const insertedEvents = await tx
        .insert(schema.events)
        .values(eventRows.map(({ categoryIds: _categoryIds, ...event }) => event))
        .returning({ id: schema.events.id });

      // Link events and categories. `insertedEvents[index]` matches `eventRows[index]` (same order).
      // `noUncheckedIndexedAccess` makes array[index] possibly undefined, hence the check.
      const eventCategoryRows = eventRows.flatMap((event, index) => {
        const insertedEvent = insertedEvents[index];

        if (!insertedEvent) {
          throw new Error(`Expected an inserted event at index ${index}.`);
        }

        return event.categoryIds.map((categoryId) => ({
          eventId: insertedEvent.id,
          categoryId,
        }));
      });

      await tx.insert(schema.eventCategories).values(eventCategoryRows);
    });

    // process.stdout.write instead of console.log, because our ESLint config warns on console.log.
    process.stdout.write(
      `Seeded ${userRows.length} users, ${categoryRows.length} categories, ${venueRows.length} venues, and 30 events.\n`,
    );
  } finally {
    // Close the connection pool, or the Node process would stay open and never exit.
    await pool.end();
  }
}

// Run it. On failure, print the error and exit with a non-zero code (so CI / npm know it failed).
seed().catch((error: unknown) => {
  console.error('Database seeding failed:', error);
  process.exitCode = 1;
});
