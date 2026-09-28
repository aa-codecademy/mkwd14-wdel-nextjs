/**
 * ROUTE: /rendering/static   — STATIC RENDERING (prerendering)
 *
 * This page uses nothing that depends on the incoming request (no cookies,
 * no headers, no search params). So during `npm run build`, Next.js renders
 * it ONCE, saves the HTML, and serves that same HTML to every visitor.
 *
 * How to see it:
 * - `npm run dev`: pages are rendered on every request in development so you
 *   always see your latest code. The time changes on every refresh.
 * - `npm run build && npm run start`: the time is FROZEN at the moment of the
 *   build. Refresh as much as you like — it stays the same.
 *   In the build output, this route is marked with ○ (Static).
 *
 * Static pages are the fastest option: no server work per request, and the
 * HTML can be cached on a CDN close to the user.
 */
export default function Page() {
	// This line runs at BUILD time (in production), not when a user visits.
	const renderedTime = new Date().toISOString();

	return (
		<div>
			<h1>Static</h1>
			<p>rendered at: {renderedTime}</p>
		</div>
	);
}
