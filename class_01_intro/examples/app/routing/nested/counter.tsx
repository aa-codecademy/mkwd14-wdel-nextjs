'use client';

import { useState } from 'react';

export default function Counter() {
	const [count, setCount] = useState(0);

	return (
		<button
			className='rounded border border-gray-400 px-3 py-1 font-mono cursor-pointer'
			onClick={() => setCount(currCount => currCount + 1)}>
			Layout counter: {count}
		</button>
	);
}
