/**
 * THE AUTH SERVER — the one place where Better Auth is configured.
 *
 * Better Auth is a library that handles sign-up, sign-in, sessions and OAuth for us, so we don't write
 * (and get wrong) security-critical code ourselves. This file creates the `auth` object that
 * everything else uses:
 *
 *   app/api/auth/[...all]/route.ts   exposes it over HTTP  (/api/auth/sign-in/social, /get-session, ...)
 *   lib/session.ts                   reads the current user on the server:  auth.api.getSession(...)
 *   lib/auth-client.ts               the browser-side twin, used by buttons and hooks
 *
 * VOCABULARY (the two words people mix up):
 *   AUTHENTICATION = "who are you?"            -> sign in with GitHub, or email + password
 *   AUTHORIZATION  = "what are you allowed to do?"  -> only organizers may open the dashboard
 *
 * HOW A LOGIN WORKS, in one picture:
 *   1. You prove who you are (a password, or "Continue with GitHub").
 *   2. The server creates a SESSION: a row in the `session` table with a random token.
 *   3. The token is sent to your browser as a COOKIE (httpOnly: JavaScript can't read it).
 *   4. On every later request the browser sends the cookie back, the server finds the session
 *      row, and so knows who you are. Signing out deletes the row and the cookie.
 *
 * ⚠️ `import 'server-only'`: this file holds secrets (the GitHub client secret). A Client Component
 *    must never import it, and the build fails if one does.
 */
import 'server-only';
// The ADAPTER teaches Better Auth to talk to our database through Drizzle. (Better Auth's docs
// import it from 'better-auth/adapters/drizzle'. In this version it's also a package of its own.)
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import { db } from '.';
// The tables Better Auth needs (user, session, account, verification). See db/auth-schema.ts.
import * as schema from './auth-schema';
// PLUGINS add features. `admin` adds roles and banning. `nextCookies` makes login work from Server Actions.
import { admin } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';

// "Sign in with GitHub" is OPTIONAL: it's switched on only if BOTH environment variables exist, so the
// app still starts for someone who hasn't created a GitHub OAuth app yet. (See the class 07 README,
// "Getting the GitHub credentials".) `undefined` means no social providers at all.
// `process.env.X && process.env.Y ? {...} : undefined` = "if both are set, use this object, else nothing".
const github =
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  // WHERE the data lives. Our existing Drizzle `db`, PostgreSQL ('pg'), and the auth tables.
  database: drizzleAdapter(db, { provider: 'pg', schema }),

  // EMAIL + PASSWORD login, switched on on the SERVER. The password is stored HASHED (a one-way
  // scrambled version), never as plain text. `minPasswordLength` is checked by Better Auth.
  // `autoSignIn: true`: after sign-up the user is signed in right away (no second step).
  // (⚠️ The server supports it, but the sign-in / sign-up pages have no email form yet.)
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },

  // GITHUB login (OAuth): GitHub proves who the user is, we never see a password.
  socialProviders: github,

  user: {
    // EXTRA COLUMNS on the user table, beyond Better Auth's own (name, email, image, ...).
    additionalFields: {
      // A short public name, unique. `input: false` = the CLIENT can't set it when signing up,
      // only our server code can. (Otherwise anyone could register as someone else's handle.)
      handle: { type: 'string', required: false, unique: true, input: false },
    },
  },

  plugins: [
    // Adds a `role` to every user (plus banned/banReason/banExpires), and APIs to manage users.
    // New accounts start as 'attendee'. Only roles listed in `adminRoles` count as admins to the
    // plugin. 'organizer' is OUR OWN role: it's just a string that lib/roles.ts knows about.
    admin({ defaultRole: 'attendee', adminRoles: ['admin'] }),
    // Lets Server Actions set the session cookie. It must be the LAST plugin in the list.
    nextCookies(),
  ],
});

// TYPES inferred from the configuration, so `session.user.handle` and `session.user.role` are known
// to TypeScript. They always match what we configured above.

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session['user'];
