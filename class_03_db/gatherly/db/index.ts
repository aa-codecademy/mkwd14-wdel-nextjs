import 'server-only';
import { Pool } from 'pg';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/node-postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString)
  throw new Error('DATABASE_URL is not set. Copy from .env.example to .env to fill it out.');

const pool = new Pool({ connectionString });

export const db = drizzle({
  client: pool,
  schema,
  casing: 'snake_case',
  logger: true,
});
