/**
 * ROUTE HANDLER: /api/auth/*  — the HTTP face of Better Auth.
 *
 * `[...all]` is a CATCH-ALL segment: it matches /api/auth/anything/at/all. Better Auth owns every
 * URL under it: /api/auth/sign-in/social, /api/auth/sign-out, /api/auth/get-session, and the
 * one GitHub calls back: /api/auth/callback/github. (That last one is the "redirect URL" you give
 * GitHub when you register the OAuth app.)
 *
 * `route.ts` is the special file for an API endpoint (a "Route Handler"), the counterpart of
 * `page.tsx`. It exports a function per HTTP method; `toNextJsHandler(auth)` builds GET and POST
 * for us. We never call these URLs by hand: the auth client does (lib/auth-client.ts).
 *
 * Keep the path /api/auth/[...all]. It's Better Auth's default, and the GitHub redirect URL
 * depends on it.
 */
import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '../../../../db/auth';

export const { GET, POST } = toNextJsHandler(auth);
