/**
 * NOT FOUND UI for /error-examples/[id]
 *
 * Same idea as ../not-found.tsx, but closer to the page. When
 * [id]/page.tsx calls notFound(), Next.js picks THIS file because it is the
 * nearest one. That lets you show a specific message, e.g.
 * "This event doesn't exist" for /events/[slug].
 *
 * Try deleting this file: /error-examples/123 then falls back to
 * error-examples/not-found.tsx.
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
