'use client';

import { useState } from 'react';

export function ThrowButton({ label }: { label: string }) {
	const [shouldThrow, setShouldThrow] = useState(false);

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
