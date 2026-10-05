import { connection } from 'next/server';
import { Suspense } from 'react';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function Slow({ ms, label }: { ms: number; label: string }) {
	await sleep(ms);
	return (
		<div className='rounded border-2 border-blue-400 p-4'>
			{label} — finished after {ms / 1000}s
		</div>
	);
}

export default async function StreamingPage() {
	await connection();

	return (
		<div>
			<h1>STREAMING</h1>

			{/* <Slow ms={2000} label='Not in suspense' /> */}

			<Suspense
				fallback={
					<div className='animate-pulse rounded bg-gray-200 p-4'>Loading…</div>
				}>
				<Slow ms={5000} label='Inside Suspense' />
			</Suspense>
		</div>
	);
}
