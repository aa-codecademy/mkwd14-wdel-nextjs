/**
 * ROUTE: /styling   — three ways to style in Next.js
 *
 * 1. Tailwind utility classes      -> className='text-xl font-bold'
 * 2. A regular CSS file            -> import './page-styling.css' + className='card'
 * 3. Inline styles (a JS object)   -> style={{ ... }}
 *
 * In this course we mostly use (1) Tailwind. The others are shown so you
 * recognise them in other codebases.
 */

// (2) Importing a CSS file: Next.js bundles it and adds it to the page.
// In the App Router you can import global CSS from any component, not only
// from the root layout. See the note inside page-styling.css about scoping.
import './page-styling.css';

// (3) Inline styles in React are a JS object, not a string, and property
// names are camelCase: `backgroundColor`, not `background-color`.
// ⚠️ `textColor` is NOT a CSS property, so React silently ignores it and the
// text stays black. The correct property is `color: 'lightblue'`.
// TypeScript would catch this if the object were typed as React.CSSProperties:
//   const container: React.CSSProperties = { ... }
const container = {
	backgroundColor: 'red',
	textColor: 'lightblue',
	textDecoration: 'underline',
};

export default function Page() {
	return (
		<div>
			{/* (1) Tailwind: each class does exactly one thing. */}
			<h1 className='text-xl font-bold'>@theme tokens</h1>
			{/*
			 * `bg-gatherly` is NOT a built-in Tailwind class. It exists because
			 * app/globals.css defines `--color-gatherly` inside `@theme`, and
			 * Tailwind generates bg-gatherly, text-gatherly, border-gatherly, ...
			 * from every `--color-*` token. That's how you add brand colours.
			 *
			 * ⚠️ `text-brown` does nothing: Tailwind has no "brown" colour and we
			 * haven't defined `--color-brown` in @theme. Tailwind ignores unknown
			 * classes silently — the Tailwind CSS IntelliSense extension helps
			 * spot these.
			 */}
			<div className='mt-4 rounded bg-gatherly p-6 font-mono text-brown'>
				bg-gatherly
			</div>

			{/* (2) A class defined in the plain CSS file. */}
			<div className='card'>
				<h1>This is a card</h1>
			</div>

			{/* (3) Inline style object — outer braces = "JS expression", the object is inside. */}
			<div style={container}>
				<h1>JS in CSS</h1>
			</div>
		</div>
	);
}
