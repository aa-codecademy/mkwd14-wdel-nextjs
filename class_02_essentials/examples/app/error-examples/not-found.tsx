/**
 * NOT FOUND UI for /error-examples and everything below it.
 *
 * Rendered when `notFound()` (from 'next/navigation') is called in a page of
 * this folder, e.g. /error-examples/missing. The response gets an HTTP 404
 * status, which matters for search engines and monitoring.
 *
 * Next.js uses the CLOSEST not-found.tsx above the page that called
 * notFound(). /error-examples/123 uses the one in [id]/ instead.
 *
 * Note: an unknown URL like /does-not-exist is handled by `app/not-found.tsx`
 * (or Next.js's default 404 page, because this example app doesn't have one).
 *
 * This is a Server Component. Unlike error.tsx, it doesn't need 'use client'.
 */
export default function NotFound() {
	return (
		<div className='rounded border-2 border-gray-400 bg-gray-50 p-4'>
			<h1>404 - Not found</h1>
			<p className='mt-2'>
				No such thing. notFound() was called, so this rendered — with a 404
				status.
			</p>
		</div>
	);
}
