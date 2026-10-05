import { connection } from 'next/server';
import { ClientLog } from './client-log';

export default async function WhereDoesThisRun() {
	await connection();

	console.log(
		'WhereDoesThisRun: I ran on the SERVER at: ',
		new Date().toISOString(),
	);

	return (
		<div>
			<h1>Server component</h1>

			<ClientLog />
		</div>
	);
}
