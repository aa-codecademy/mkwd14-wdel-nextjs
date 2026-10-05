/**
 * CLIENT COMPONENT — a button that crashes its own render on purpose.
 *
 * Why not just `throw` inside onClick? React error boundaries (error.tsx)
 * only catch errors that happen while RENDERING. An error thrown inside an
 * event handler never reaches error.tsx.
 *
 * So the click only sets state. React re-renders the component, and on that
 * render we throw. That's a render error, which error.tsx can catch.
 *
 * `components/` inside `app/` is not a route: it has no page.tsx, so it's
 * just a normal folder for shared components.
 */
'use client';

import { useState } from 'react';

// Props are typed inline: `{ label: string }`. With more props, you'd usually
// define a `type ThrowButtonProps = { ... }` above the component.
export function ThrowButton({ label }: { label: string }) {
	const [shouldThrow, setShouldThrow] = useState(false);

	// Runs during render. Once shouldThrow is true, this component can't render
	// anymore, and the nearest error.tsx takes over.
	if (shouldThrow) {
		throw new Error(`Boom - thrown by ${label} - button`);
	}

	return (
		<button
			className='rounded border border-red-400 px-3 py-1 text-red-700'
			onClick={() => setShouldThrow(true)}>
			{label}
		</button>
	);
}
