import { loadEnvConfig } from '@next/env';
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

const userRows = Array.from({ length: 15 }, (_, index) => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).replace('@', `+${index}@`).toLowerCase(),
    handle: `${faker.internet.username().toLowerCase()}-${index}`,
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

const eventStatuses = ['draft', 'published', 'cancelled'] as const;

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
      coverImageUrl: faker.image.url(),
      startsAt,
      endsAt: new Date(startsAt.getTime() + faker.number.int({ min: 1, max: 8 }) * 60 * 60 * 1000),
      status: faker.helpers.arrayElement(eventStatuses),
      city: venue.city,
      minPriceCents: faker.number.int({ min: 0, max: 10_000 }),
      venueId: venue.id,
      organizerId: faker.helpers.arrayElement(organizerIds),
      categoryIds: faker.helpers.arrayElements(categoryIds, { min: 1, max: 3 }),
    };
  });

async function seed() {
  try {
    await db.transaction(async (tx) => {
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
      const insertedEvents = await tx
        .insert(schema.events)
        .values(eventRows.map(({ categoryIds: _categoryIds, ...event }) => event))
        .returning({ id: schema.events.id });

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

    process.stdout.write(
      `Seeded ${userRows.length} users, ${categoryRows.length} categories, ${venueRows.length} venues, and 30 events.\n`,
    );
  } finally {
    await pool.end();
  }
}

seed().catch((error: unknown) => {
  console.error('Database seeding failed:', error);
  process.exitCode = 1;
});
