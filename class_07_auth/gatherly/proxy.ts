/**
 * THE PROXY — code that runs BEFORE a request reaches a page. (In Next.js 16 `proxy.ts` replaces
 * `middleware.ts`, and the function is called `proxy`.)
 *
 *   browser ──► proxy.ts ──► the page / route
 *                 │
 *                 └─ not signed in? redirect to /sign-in right away
 *
 * It runs for the paths in `config.matcher` below: everything under /dashboard.
 *
 * ⚠️ READ THIS TWICE. `getSessionCookie` only checks that a cookie with the right NAME exists. It does
 * NOT check that the session is real. Anyone can add a cookie by hand in the browser and walk
 * through this check. So the proxy is an OPTIMISTIC, fast redirect for honest visitors, nothing more.
 * The real checks are `requireOrganizer()` in lib/session.ts (it asks the database), called inside
 * the pages and Server Actions. This is called DEFENCE IN DEPTH: several layers, each one assuming
 * the one before it can fail.
 *
 * Better Auth's docs say the same thing. And the proxy must stay cheap: no database call here.
 */
// Reads the session cookie from the request. It checks the cookie EXISTS, not that it is valid.
import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    // Send the visitor to the sign-in page, and remember where they were going (`?next=...`), so we
    // can bring them back afterwards. `searchParams.set` encodes the value for us.
    // (Only the PATH is kept, not the query string. app/(marketing)/_components/safe-next.ts
    //  checks `next` again on the way back, because a URL parameter is user input.)
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }

  // A cookie exists: let the request through. The PAGE then does the real check.
  return NextResponse.next();
}

// Run the proxy ONLY for these paths. `:path*` = "/dashboard and anything below it". Without a
// matcher the proxy would run for every request, including images and CSS.
export const config = {
  matcher: ['/dashboard/:path*'],
};
