/**
 * ROUTE: /
 *
 * In the App Router, the FOLDER structure inside `app/` defines the URLs,
 * and a file named `page.tsx` makes that folder a publicly reachable route.
 *
 *   app/page.tsx                -> /
 *   app/routing/page.tsx        -> /routing
 *   app/routing/nested/page.tsx -> /routing/nested
 *
 * A page is just a React component that is `export default`-ed.
 * The name of the function ("Home") does not matter to Next.js — only the
 * file name and its location do.
 *
 * This is a SERVER COMPONENT (the default in the App Router): it runs on the
 * server, and only the resulting HTML is sent to the browser. No JavaScript
 * for this component ends up in the browser bundle.
 */
export default function Home() {
	return <div>Hello World!</div>;
}
