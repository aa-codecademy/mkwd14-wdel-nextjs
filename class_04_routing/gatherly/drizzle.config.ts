/**
 * DRIZZLE KIT CONFIG — settings for the `drizzle-kit` command line tool
 * (`npm run db:generate`, `db:migrate`, `db:studio`).
 *
 * drizzle-kit runs OUTSIDE Next.js, so it does not load `.env` by itself. That's why we call
 * `loadEnvConfig` from @next/env: it reads .env the same way Next.js does, so there is only ONE
 * place (.env) where the database URL lives.
 */
import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

loadEnvConfig(process.cwd());

// Read the URL only after loadEnvConfig() ran. Variables already set in your shell win over .env,
// which is handy to point a command at another database for a moment:
//   DATABASE_URL=postgres://... npm run db:migrate
const url = process.env.DATABASE_URL;

if (!url)
  throw new Error('DATABASE_URL is not set. Copy from .env.example to .env to fill it out.');

export default defineConfig({
  // Which database we talk to (Drizzle also supports MySQL, SQLite, ...).
  dialect: 'postgresql',
  // Where our table definitions are. `generate` reads this file.
  schema: './db/schema.ts',
  // Where generated SQL migrations + snapshots are written. COMMIT this folder to git, and never
  // edit the files by hand (see the README).
  out: './drizzle',
  // How to connect (used by `migrate` and `studio`).
  dbCredentials: { url },
  // Same value as in db/index.ts, so generated SQL uses snake_case names.
  casing: 'snake_case',
  // `drizzle-kit push` (a shortcut we don't use) asks "are you sure?" before running SQL.
  strict: true,
  // Print the SQL statements drizzle-kit runs, so you can see what's happening.
  verbose: true,
});
