/**
 * ROUTE: /error-examples   — handling errors and "not found"
 *
 * The files in this folder show the special files Next.js uses when something
 * goes wrong:
 *
 *   error-examples/
 *   ├── page.tsx         <- this page, with a button that crashes on purpose
 *   ├── error.tsx        <- shown when a page in this folder (or below) THROWS
 *   ├── not-found.tsx    <- shown when notFound() is called in this folder
 *   ├── missing/
 *   │   └── page.tsx     <- /error-examples/missing: always calls notFound()
 *   └── [id]/
 *       ├── page.tsx     <- /error-examples/123 -> 404, any other id -> OK
 *       └── not-found.tsx
 *
 * Try:
 *   - click "Throw unhandled"       -> error.tsx replaces this page
 *   - /error-examples/missing       -> error-examples/not-found.tsx
 *   - /error-examples/123           -> error-examples/[id]/not-found.tsx
 *   - /error-examples/42            -> the normal [id] page
 *
 * In development you'll also see the Next.js error overlay on top of the page.
 * Close it (or run a production build) to see your error.tsx UI on its own.
 */
import { ThrowButton } from '../components/throw-button';

// A Server Component that renders a Client Component (ThrowButton).
export default function ErrorsPage() {
	return (
		<div className='space-y-4'>
			<h1 className='text-xl font-bold'>Error states examples</h1>
			<ul className='space-y-3'>
				<li>
					<ThrowButton label='Throw unhandled' />
				</li>
			</ul>
		</div>
	);
}
