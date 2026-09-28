import { headers } from 'next/headers';

export default async function Page() {
	const requestHeaders = await headers();

	return (
		<div>
			<h1>Dynamic content</h1>
			<p>User Agent: {requestHeaders.get('user-agent')}</p>
		</div>
	);
}
