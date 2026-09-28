/**
 * ROUTE: /routing/nested
 *
 * This page is rendered INSIDE `./layout.tsx` (as its `children`).
 * The page itself only contains what is unique to this URL — the shared
 * frame (title, counter, links) comes from the layout.
 */
export default function NestedPage() {
	return <h1>Nested Page</h1>;
}
