/**
 * ROUTE: /where-does-this-run   — SERVER COMPONENT
 *
 * The big question of the App Router: WHERE does my code run?
 *
 * Open this page and look in TWO places:
 *   1. the TERMINAL running `npm run dev`  -> "I ran on the SERVER at: ..."
 *   2. the BROWSER DevTools console        -> "I am running on the BROWSER (CLIENT)"
 *
 * The server log never appears in the browser, and the client log never
 * appears in the terminal. That's because:
 * - This page has no 'use client', so it's a Server Component. Its code runs
 *   only on the server, and its JavaScript is never sent to the browser.
 * - <ClientLog /> is a Client Component ('use client'). Its `useEffect` runs
 *   only in the browser, after the page has loaded and React has "hydrated" it.
 *
 * Consequence: secrets (API keys, DB passwords) are safe in Server Components
 * and must NEVER be used in Client Components, because their code is public.
 */
import { connection } from 'next/server';
import { ClientLog } from './client-log';

export default async function WhereDoesThisRun() {
	// `await connection()` means "wait for a real incoming request before
	// rendering". It opts this page into DYNAMIC rendering (ƒ in the build
	// output). Without it, the page uses nothing request-specific, so Next.js
	// would prerender it once at BUILD time (○ Static). The console.log below
	// would then run during `npm run build`, not when you visit the page.
	await connection();

	// Runs on the server for every request -> look in your terminal.
	console.log(
		'WhereDoesThisRun: I ran on the SERVER at: ',
		new Date().toISOString(),
	);

	return (
		<div>
			<h1>Server component</h1>

			{/*
			 * A Server Component can RENDER a Client Component. The server sends
			 * ClientLog's HTML plus a reference to its JS bundle, and the
			 * browser loads that bundle and makes it interactive.
			 * (The opposite does not work: a Client Component cannot import a
			 * Server Component. It can only receive one as `children`.)
			 */}
			<ClientLog />
		</div>
	);
}
