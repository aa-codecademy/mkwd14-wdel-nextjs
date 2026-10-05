/**
 * CLIENT COMPONENT — used by /where-does-this-run
 *
 * 'use client' marks the "boundary": this file, and everything it imports,
 * becomes part of the JavaScript bundle sent to the browser.
 *
 * ⚠️ A Client Component still renders on the SERVER first, to produce the
 * initial HTML. So "client" does not mean "browser only". What runs ONLY in
 * the browser are effects (`useEffect`) and event handlers (`onClick`, ...).
 * That's why the log is inside useEffect: a console.log directly in the
 * function body would show up in BOTH the terminal and the browser.
 */
'use client';

import { useEffect } from 'react';

// A named export (`export function`) instead of `export default`.
// Only special files (page, layout, error, ...) need a default export.
// For normal components, named exports are easier to search and refactor.
export function ClientLog() {
	// useEffect runs AFTER the component is shown in the browser.
	// The empty dependency array [] means "run once, after the first render".
	// (In development, React Strict Mode runs effects twice on purpose to help
	// you find bugs, so you may see this log two times.)
	useEffect(() => {
		console.log('WhereDoesThisRun: I am running on the BROWSER (CLIENT)');
	}, []);

	return (
		<div>
			<h2>I am a CLIENT component</h2>
		</div>
	);
}
