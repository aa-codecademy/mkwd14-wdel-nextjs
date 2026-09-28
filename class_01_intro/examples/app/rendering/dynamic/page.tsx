/**
 * ROUTE: /rendering/dynamic   — DYNAMIC RENDERING (server-side rendering)
 *
 * This page reads the request headers. Headers are different for every
 * visitor, so the HTML can't be generated ahead of time — Next.js has to
 * render this page on the server FOR EACH REQUEST.
 *
 * Functions that opt a route into dynamic rendering include
 * `headers()`, `cookies()`, and reading `searchParams`.
 *
 * Compare with /rendering/static after running
 * `npm run build && npm run start`: in the build output this route is marked
 * with ƒ (Dynamic), and the content reflects the current request every time.
 */
import { headers } from 'next/headers';

// `async` component: Server Components can await data directly — no
// useEffect, no loading state boilerplate.
export default async function Page() {
	// `headers()` returns a Promise in Next.js 15+, so it has to be awaited.
	// This only works on the server (Server Components, Server Actions,
	// Route Handlers) — the browser never sees this code.
	const requestHeaders = await headers();

	return (
		<div>
			<h1>Dynamic content</h1>
			{/* Open this page in two different browsers — each shows its own value. */}
			<p>User Agent: {requestHeaders.get('user-agent')}</p>
		</div>
	);
}
