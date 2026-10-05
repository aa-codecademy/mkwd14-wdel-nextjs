/**
 * ROUTE: /error-examples/missing
 *
 * Always calls notFound(). This folder has no not-found.tsx of its own, so
 * Next.js walks UP the tree and renders error-examples/not-found.tsx.
 *
 * TypeScript accepts a component that returns nothing here, because
 * notFound() has the return type `never` (it always throws).
 */
import { notFound } from 'next/navigation';

export default function MissingPage() {
	notFound();
}
