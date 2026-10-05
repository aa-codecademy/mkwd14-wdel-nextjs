'use client';

export default function ErrorsPage({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<div className='rounded border-2 border-red-400 bg-red-50 p-4'>
			<h2 className='text-xs text-red-600'>This is the error page.</h2>
			<p className='mt-2 font-mono'>{error.message}</p>
			<button className='mt-4 underline' onClick={() => retry()}>
				Try again
			</button>
		</div>
	);
}
