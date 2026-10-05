/**
 * ROUTE: /error-examples/[id]   — dynamic route that can return a 404
 *
 * The usual pattern for a detail page:
 *   1. read the id from the URL,
 *   2. look the item up (later: in the database),
 *   3. if it doesn't exist, call notFound().
 *
 * Here we fake step 2: id "123" means "doesn't exist", everything else exists.
 *
 * Note: /error-examples/missing does NOT come here. A static folder
 * (missing/) always wins over a dynamic one ([id]/).
 */
import { notFound } from 'next/navigation';

export default async function IDPage({
	params,
}: PageProps<'/error-examples/[id]'>) {
	// `params` is a Promise in Next.js 15+, so await it.
	const { id } = await params;

	if (id === '123') {
		// notFound() THROWS a special error. Nothing after this line runs, and
		// there's no need to `return`. Next.js catches it and renders the
		// nearest not-found.tsx with a 404 status.
		notFound();
	}
	
	return <div>some product with id that exists</div>;
}
