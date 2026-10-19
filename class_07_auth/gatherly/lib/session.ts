/**
 * SESSION HELPERS — "who is making this request?" on the SERVER, and the guards built on it.
 *
 * Three functions, from weakest to strongest guard:
 *
 *   getCurrentUser()        -> the user, or `null` if nobody is signed in. Never redirects.
 *   requireUser(returnTo)   -> a signed-in user, or REDIRECT to the sign-in page.      (authentication)
 *   requireOrganizer(...)   -> a signed-in organizer/admin, or a redirect.              (authorization)
 *
 * Use them at the TOP of every page and every Server Action that needs a user:
 *
 *   const organizer = await requireOrganizer('/dashboard');   // stops here if not allowed
 *
 * WHY do we check inside pages and actions, when proxy.ts already guards /dashboard? Because
 * proxy.ts only checks that a cookie EXISTS (anyone can forge one). These functions ask the DATABASE
 * "is this session real, and whose is it?". They are the real gate. See the table in
 * the class 07 README: proxy = a quick bouncer, these = the actual lock.
 *
 * Not 'server-only' written out, but `auth` (db/auth.ts) is, so importing this file from a Client
 * Component fails the build.
 */
// headers(): the incoming request's headers, where the session cookie travels.
import { headers } from 'next/headers';
import { auth } from '../db/auth';
import { redirect } from 'next/navigation';
import { canManageEvents } from './roles';

// WHO IS ASKING? We hand Better Auth the request's headers. It reads the session cookie, looks the
// token up in the `session` table, checks it hasn't expired, and returns { session, user } or null.
// `headers()` is async in Next.js 16, hence the `await`. Reading the cookie also makes the page
// DYNAMIC (rendered per request), which is exactly what we want for anything user-specific.
// (Called twice in one request it asks the database twice. React's `cache()` can dedupe that.)
export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // `session?.user ?? null`: the user if there is a session, otherwise `null` (never undefined).
  return session?.user ?? null;
}

// AUTHENTICATION guard: "you must be signed in". `returnTo` is the page the user wanted, so after
// signing in they come back to it (the `next` parameter). `encodeURIComponent` makes the path safe
// inside a URL, e.g. "/dashboard/events/new" -> "%2Fdashboard%2Fevents%2Fnew".
// `redirect()` throws, so nothing below it runs, and TypeScript knows `user` is not null afterwards.
export async function requireUser(returnTo: string) {
  const user = await getCurrentUser();

  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);

  return user;
}

// AUTHORIZATION guard: "you must be signed in AND allowed". Two different failures, two different
// answers (the HTTP world calls them 401 and 403):
//   not signed in           -> to the sign-in page      (401: "who are you?")
//   signed in, wrong role   -> to /organizers-only      (403: "I know you, but no")
// Treating them differently is kind: a visitor should sign in, an attendee should be told why not.
export async function requireOrganizer(returnTo: string) {
  const user = await requireUser(returnTo);

  if (!canManageEvents(user.role)) redirect('/organizers-only');

  return user;
}
