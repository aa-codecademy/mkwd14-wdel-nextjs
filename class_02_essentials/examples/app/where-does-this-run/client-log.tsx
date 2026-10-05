'use client';

import { useEffect } from 'react';

export function ClientLog() {
	useEffect(() => {
		console.log('WhereDoesThisRun: I am running on the BROWSER (CLIENT)');
	}, []);

	return (
		<div>
			<h2>I am a CLIENT component</h2>
		</div>
	);
}
