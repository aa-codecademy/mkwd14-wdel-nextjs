/**
 * THE AUTH TABLES — what Better Auth stores in OUR database (PostgreSQL).
 *
 * Better Auth can GENERATE this file (`npx auth@latest generate`), based on the config in
 * db/auth.ts. We then run it through the usual Drizzle workflow: `npm run db:generate` writes the
 * SQL (drizzle/0004_*.sql), `npm run db:migrate` runs it. Four tables:
 *
 *   user          who someone is: name, email, role, ... (this REPLACES our old `users` table)
 *   session       one row per signed-in browser: a token + an expiry
 *   account       HOW a user signs in: a row for the password, a row for GitHub, ...
 *   verification  short-lived codes (email verification, password reset). Unused so far.
 *
 *   user ──< session        one user can be signed in on several devices
 *   user ──< account        one user can have several ways to sign in (GitHub AND a password)
 *
 * ⚠️ Don't rename these tables or columns by hand. Better Auth expects exactly these names.
 *    (A column we add on purpose, like `handle`, is declared in db/auth.ts as an `additionalField`.)
 */
// pgTable('table_name', { columns }) declares one table.

import { relations } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// The person. Our events and orders now point at THIS table (events.organizerId, orders.userId).
export const user = pgTable('user', {
  // `text`, not `uuid`: Better Auth creates its own ids (random strings). That's why events.organizerId
  // and orders.userId became `text` in the same migration.
  id: text().primaryKey(),
  name: varchar().notNull(),
  email: text().notNull().unique(),
  // Has the user proved they own the email? (Nothing sets it to true yet: no verification emails.)
  emailVerified: boolean().default(false).notNull(),
  // The avatar URL. GitHub sign-in fills it in.
  image: text(),
  // OUR extra column (the `additionalFields` in db/auth.ts).
  handle: text().unique(),
  // The ROLE, the basis of AUTHORIZATION: 'attendee' | 'organizer' | 'admin' (see lib/roles.ts).
  // It's plain text, so the database doesn't stop a typo. The code that reads it (`parseRole`) does.
  role: text().notNull().default('attendee'),
  // Added by the `admin` plugin: a ban switch, the reason, and when the ban ends.
  banned: boolean().default(false),
  banReason: varchar(),
  banExpires: timestamp({ withTimezone: true }),

  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// One row per signed-in browser. Signing in INSERTs a row, signing out DELETEs it. To "sign someone
// out everywhere", delete their rows. (That's an advantage of database sessions over self-contained
// tokens: you can revoke them.)
export const session = pgTable('session', {
  id: text('id').primaryKey(),
  // After this moment the session no longer works, and the user has to sign in again.
  expiresAt: timestamp().notNull(),
  // The random secret that travels in the cookie. UNIQUE, and anyone who knows it IS that user
  // (that's why the cookie is httpOnly, and why you never log or share it).
  token: text().notNull().unique(),
  // For a "your active sessions" page: where and with what browser they signed in.
  ipAddress: text(),
  userAgent: text(),
  // `cascade`: deleting a user deletes their sessions too.
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // Set when an admin "impersonates" a user (a plugin feature). Unused here.
  impersonatedBy: text(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// HOW a user can sign in. A user can have several accounts: one per provider.
//   providerId 'github'      -> accountId is the user's GitHub id, plus the OAuth tokens
//   providerId 'credential'  -> email + password; `password` holds the HASH
export const account = pgTable('account', {
  id: text().primaryKey(),
  // The user's id at the provider (GitHub's numeric id, or our own user id for passwords).
  accountId: text().notNull(),
  // Which sign-in method this row is: 'github', 'credential', ...
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  // OAuth tokens GitHub gave us. SENSITIVE: they let us act as the user on GitHub. We don't use
  // them, but they're stored. Treat this table like a password table: never expose it.
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  // The password HASH for 'credential' accounts (empty for GitHub). Never the password itself.
  password: text(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Short-lived one-time codes ("verify this email", "reset this password"). Nothing writes here yet.
export const verification = pgTable('verification', {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// RELATIONS for Drizzle's query API (they don't change the database). See class 3 / db/schema.ts.
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// The type of one user row. (The old `User` type from db/schema.ts is gone with the old table.)
export type User = typeof user.$inferSelect;
