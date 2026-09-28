/**
 * CLIENT COMPONENT
 *
 * Every component in the App Router is a Server Component by default.
 * Server Components can NOT use state, effects or event handlers, because
 * they never run in the browser.
 *
 * The 'use client' directive marks this file as a Client Component. It must
 * come before any imports or code (only comments may sit above it).
 * Being a Client Component means:
 * - it is still rendered to HTML on the server for the first load,
 * - but its JavaScript is ALSO sent to the browser and "hydrated",
 *   so `useState` and `onClick` work there.
 *
 * Rule of thumb: keep 'use client' as low in the tree as possible — make only
 * the small interactive piece a Client Component (like this button), and let
 * pages and layouts stay Server Components.
 */
'use client';

import { useState } from 'react';

export default function Counter() {
	// useState returns [currentValue, setterFunction].
	// Calling the setter tells React to re-render this component with the new value.
	const [count, setCount] = useState(0);

	return (
		<button
			className='rounded border border-gray-400 px-3 py-1 font-mono cursor-pointer'
			// The "updater function" form (currCount => currCount + 1) always uses
			// the latest state value. Prefer it whenever the new state depends on
			// the previous one.
			onClick={() => setCount(currCount => currCount + 1)}>
			Layout counter: {count}
		</button>
	);
}
