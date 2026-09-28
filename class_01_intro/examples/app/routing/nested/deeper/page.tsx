/**
 * ROUTE: /routing/nested/deeper
 *
 * This folder has no `layout.tsx` of its own, so Next.js walks UP the tree and
 * uses the closest layouts it finds: `app/routing/nested/layout.tsx` and then
 * the root `app/layout.tsx`. If you added a `layout.tsx` here, it would be
 * rendered inside the nested layout — layouts stack on top of each other.
 */
export default function DeeperRoute() {
	return <h3>Deeper route</h3>;
}
