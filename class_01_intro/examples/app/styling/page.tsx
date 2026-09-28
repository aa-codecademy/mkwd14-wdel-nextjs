import './page-styling.css';

const container = {
	backgroundColor: 'red',
	textColor: 'lightblue',
	textDecoration: 'underline',
};

export default function Page() {
	return (
		<div>
			<h1 className='text-xl font-bold'>@theme tokens</h1>
			<div className='mt-4 rounded bg-gatherly p-6 font-mono text-brown'>
				bg-gatherly
			</div>

			<div className='card'>
				<h1>This is a card</h1>
			</div>

			<div style={container}>
				<h1>JS in CSS</h1>
			</div>
		</div>
	);
}
