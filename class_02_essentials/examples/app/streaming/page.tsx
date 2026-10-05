/**
 * ROUTE: /streaming   — STREAMING with <Suspense>
 *
 * Problem: if one part of a page is slow (a slow database query or API call),
 * a normal server render waits for EVERYTHING before sending any HTML. The user
 * stares at a blank page.
 *
 * Solution: wrap the slow part in <Suspense fallback={...}>. Next.js then:
 *   1. sends the rest of the page right away, with the `fallback` in place of
 *      the slow part,
 *   2. keeps the HTTP connection open,
 *   3. "streams" the real content into the page when it is ready, and swaps
 *      out the fallback. No client-side fetching needed.
 *
 * Try it:
 * - Load the page: "STREAMING" and the grey "Loading…" box appear at once,
 *   and the blue box replaces it after 5 seconds.
 * - Uncomment the <Slow ms={2000} ... /> line that is NOT inside Suspense and
 *   reload. Now NOTHING shows for 2 seconds, because the whole page waits
 *   for it. That's what "blocking" means.
 *
 * Tip: a `loading.tsx` file in a route folder does the same thing for a whole
 * page. Next.js wraps the page in <Suspense> with your loading.tsx as the
 * fallback.
 */
import { connection } from 'next/server';
import { Suspense } from 'react';

// A fake delay that stands in for a slow database query or API call.
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// An ASYNC Server Component: it can `await` directly inside the component.
// (Client Components can't be async.) While it awaits, React "suspends" it
// and the nearest <Suspense> boundary above shows its fallback.
async function Slow({ ms, label }: { ms: number; label: string }) {
	await sleep(ms);
	return (
		<div className='rounded border-2 border-blue-400 p-4'>
			{label} — finished after {ms / 1000}s
		</div>
	);
}

export default async function StreamingPage() {
	// Makes the page dynamic (rendered per request). Without it, Next.js would
	// prerender the page at build time, wait the 5 seconds ONCE during
	// `npm run build`, and serve finished HTML. You'd never see streaming.
	await connection();

	return (
		<div>
			{/* Static part: sent immediately. */}
			<h1>STREAMING</h1>

			{/* Not wrapped in Suspense -> blocks the WHOLE page until it resolves. */}
			{/* <Slow ms={2000} label='Not in suspense' /> */}

			{/*
			 * `fallback` is shown while anything inside is still loading.
			 * Use a skeleton with the same size as the real content to avoid
			 * layout jumps (`animate-pulse` is Tailwind's skeleton animation).
			 * Several <Suspense> boundaries can load independently, side by side.
			 */}
			<Suspense
				fallback={
					<div className='animate-pulse rounded bg-gray-200 p-4'>Loading…</div>
				}>
				<Slow ms={5000} label='Inside Suspense' />
			</Suspense>
		</div>
	);
}
