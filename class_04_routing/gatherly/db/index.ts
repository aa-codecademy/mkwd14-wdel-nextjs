/**
 * DATABASE CLIENT — the one `db` object the rest of the app imports:
 *
 *   import { db } from '@/db';
 *   const rows = await db.select().from(events);
 *
 * Layers: our code -> Drizzle (builds SQL, types the result) -> `pg` Pool (manages the
 * connections) -> PostgreSQL.
 */
// `server-only` makes the build FAIL if a Client Component ever imports this file. That keeps
// the database code (and DATABASE_URL, a secret) out of the browser bundle. Next.js supports
// this import out of the box.
import 'server-only';
import { Pool } from 'pg';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/node-postgres';

// Next.js loads `.env` into process.env for us when the app runs (`next dev` / `next build`).
// The value looks like: postgres://USER:PASSWORD@HOST:PORT/DATABASE (see .env.example).
const connectionString = process.env.DATABASE_URL;

// Fail early with a readable message instead of a confusing connection error later.
if (!connectionString)
  throw new Error('DATABASE_URL is not set. Copy from .env.example to .env to fill it out.');

// A Pool keeps a few connections open and reuses them. Opening a new database connection for
// every request would be slow.
// Heads-up: in `next dev`, hot reload can re-run this file and create extra pools, and PostgreSQL
// only allows ~100 connections. If you ever see "too many clients", the usual fix is to store the
// pool on `globalThis` so it's created once. Not needed for our small app yet.
const pool = new Pool({ connectionString });

export const db = drizzle({
  client: pool,
  // Passing the schema enables the relational API: db.query.events.findMany({ with: { venue: true } }).
  schema,
  // Must match drizzle.config.ts: camelCase in TypeScript <-> snake_case in the database.
  casing: 'snake_case',
  // Print every SQL statement in the terminal running `npm run dev`. Great for learning what
  // Drizzle sends to PostgreSQL. Turn it off (or make it conditional) before production.
  logger: true,
});
