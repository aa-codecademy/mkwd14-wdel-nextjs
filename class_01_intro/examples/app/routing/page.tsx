/**
 * ROUTE: /routing
 *
 * Because this file lives in `app/routing/page.tsx`, Next.js serves it at
 * `/routing`. There is no router configuration file to edit — creating the
 * folder + `page.tsx` is enough (this is called "file-based routing").
 *
 * Folders WITHOUT a `page.tsx` are not routes on their own; they only group
 * other files. Other files you put next to `page.tsx` (like `counter.tsx` in
 * the `nested/` folder) are NOT routes either — only `page.tsx` is public.
 *
 * Try it: http://localhost:3000/routing
 */
export default function Routing() {
	return <h1>Routing page</h1>;
}
