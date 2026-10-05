/**
 * ERROR BOUNDARY for /error-examples and everything below it.
 *
 * If any page or component inside this folder throws while rendering, Next.js
 * shows this component INSTEAD of the broken part. The rest of the app
 * (root layout, header, ...) keeps working. Without an error.tsx, the error
 * bubbles up to the next error.tsx above, and finally to the built-in error
 * page, which replaces the whole screen.
 *
 * Rules:
 * - It MUST be a Client Component ('use client'), because React error
 *   boundaries are a browser feature and `retry` is called from onClick.
 * - It does NOT catch errors in the layout.tsx of the SAME folder, because
 *   the boundary sits inside that layout. To catch errors in the root layout,
 *   use `app/global-error.tsx`.
 * - Only errors thrown while RENDERING are caught, including errors from
 *   async Server Components. Errors in browser event handlers (onClick, ...)
 *   or browser callbacks (setTimeout, a .then()) are NOT caught. See
 *   components/throw-button.tsx for how it turns a click into a render error.
 */
'use client';

// The name "ErrorsPage" doesn't matter. What matters is that it's the default
// export of a file named `error.tsx`.
export default function ErrorsPage({
	error,
	retry,
}: {
	// `digest` is a hash Next.js adds to errors thrown on the SERVER. It
	// matches an entry in the server logs, so you can find the real error there.
	error: Error & { digest?: string };
	// `retry` re-renders (and re-fetches) the part that failed. If it works
	// this time, the error UI is replaced with the real content.
	// (Older tutorials call this function `reset`.)
	retry: () => void;
}) {
	return (
		<div className='rounded border-2 border-red-400 bg-red-50 p-4'>
			<h2 className='text-xs text-red-600'>This is the error page.</h2>
			{/*
			 * ⚠️ In PRODUCTION, errors thrown in Server Components show a generic
			 * message here, not the original one, so no secrets leak to the
			 * browser. Errors from Client Components (like ThrowButton) keep
			 * their message.
			 */}
			<p className='mt-2 font-mono'>{error.message}</p>
			{/*
			 * ThrowButton's state is gone after the error, so retrying renders a
			 * fresh button. It works again until you click it.
			 */}
			<button className='mt-4 underline' onClick={() => retry()}>
				Try again
			</button>
		</div>
	);
}
