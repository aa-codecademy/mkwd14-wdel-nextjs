export default function Page() {
	const renderedTime = new Date().toISOString();

	return (
		<div>
			<h1>Static</h1>
			<p>rendered at: {renderedTime}</p>
		</div>
	);
}
