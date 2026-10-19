/**
 * THE AUTH CLIENT — Better Auth for CLIENT Components (buttons, hooks).
 *
 * Two objects, two worlds (a pattern you will keep meeting):
 *
 *   db/auth.ts          `auth`        SERVER  has the secrets and the database. Never goes to the browser.
 *   lib/auth-client.ts  `authClient`  BROWSER sends requests to /api/auth/* (the route handler).
 *
 * This file has no 'use client' line, and no `server-only`: it only holds the client, which is
 * safe in the browser. The client needs no secret. It talks to our own server over HTTP, and the
 * browser attaches the session cookie by itself.
 */
import { createAuthClient } from 'better-auth/react';
import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins';
// `import type` = ONLY the type, erased at build time. That's how the browser learns the SHAPE of our
// server config (the extra `handle` field) without importing any server code or secrets.
import type { auth } from '../db/auth';

export const authClient = createAuthClient({
  plugins: [
    // The browser-side half of the `admin` plugin: adds the `role` field to the session's user type.
    adminClient(),
    // Copies the types of `additionalFields` from the server config (here: `handle`).
    inferAdditionalFields<typeof auth>(),
  ],
});

// Handy shortcuts, so components write `signOut()` instead of `authClient.signOut()`:
//   signIn.social({ provider: 'github' })   start the GitHub login
//   signIn.email({ email, password })        sign in with a password
//   signUp.email({ name, email, password })  create an account
//   signOut()                                end the session
//   useSession()                             a React hook: { data: session, isPending }, re-renders on change
export const { signIn, signUp, signOut, useSession } = authClient;
