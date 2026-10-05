/**
 * ROUTE: /
 *
 * An intentionally empty home page — the class 02 examples live on their own
 * routes:
 *   /where-does-this-run   Server vs Client Components: which code runs where
 *   /streaming             <Suspense> + streaming slow parts of a page
 *   /error-examples        error.tsx, not-found.tsx and notFound()
 *
 * Note: `Image` is imported but never used. ESLint warns about unused imports
 * (`npm run lint`), and you should remove them — but the import is harmless.
 * The bundler drops it because nothing uses it.
 */
import Image from 'next/image';

export default function Home() {
	return <div></div>;
}
