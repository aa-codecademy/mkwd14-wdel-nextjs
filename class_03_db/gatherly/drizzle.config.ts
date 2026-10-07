import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';

loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL;

if (!url)
  throw new Error('DATABASE_URL is not set. Copy from .env.example to .env to fill it out.');

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
