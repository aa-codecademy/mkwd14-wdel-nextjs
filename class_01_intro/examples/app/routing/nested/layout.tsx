/**
 * LAYOUT for /routing/nested and everything below it
 *
 * A `layout.tsx` wraps every page in its folder AND in all sub-folders:
 *
 *   /routing/nested         -> <NestedLayout><NestedPage /></NestedLayout>
 *   /routing/nested/deeper  -> <NestedLayout><DeeperRoute /></NestedLayout>
 *
 * Layouts are NESTED: this layout itself is rendered inside the root layout
 * (`app/layout.tsx`), so the final tree is
 *   RootLayout > NestedLayout > page
 *
 * 🔑 The most important behaviour: when you navigate between pages that share
 * a layout, the layout is NOT re-rendered or re-mounted — only `children`
 * changes. You can see this with the <Counter /> below: click it a few times,
 * then switch between "Nested" and "Deeper route" with the links. The count
 * is preserved, because the layout (and the Counter's state) stayed alive.
 * Now refresh the browser — the count resets, because a full reload starts
 * everything from scratch.
 *
 * This layout is a Server Component. It can still RENDER a Client Component
 * (<Counter />) — that's the normal way to add small interactive "islands"
 * to a server-rendered page.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
// `counter.tsx` sits next to this file. It is NOT a route (only `page.tsx`
// files are), so it's safe to keep components close to where they are used.
import Counter from './counter';

// `children` is whatever page (or deeper layout) is currently active.
// Here the props are typed by hand; the generated helper
// `LayoutProps<'/routing/nested'>` would work too (see app/layout.tsx).
export default function NestedLayout({ children }: { children: ReactNode }) {
	return (
		<div className='rounded border-2 border-dashed border-blue-400 p-4'>
			<h2 className='font-bold'>Nested route layout</h2>
			<div>
				<Counter />
			</div>
			<div className='mt-2 flex items-center gap-4'>
				{/*
				 * <Link> from 'next/link' instead of a plain <a>:
				 * - navigates on the CLIENT, without a full page reload
				 *   (that's why the Counter keeps its state),
				 * - PREFETCHES the target route when the link scrolls into view,
				 *   so the navigation feels instant.
				 * A plain <a href> would reload the whole document.
				 */}
				<Link href='/routing/nested'>Nested (/nested)</Link>
				<Link href='/routing/nested/deeper'>Deeper route (/nested/deeper)</Link>
			</div>
			{/* The active page is injected here. */}
			<div className='mt-4 rounded bg-gray-100 p-4'>{children}</div>
		</div>
	);
}
