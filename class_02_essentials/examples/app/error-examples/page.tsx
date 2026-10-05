import { ThrowButton } from '../components/throw-button';

export default function ErrorsPage() {
	return (
		<div className='space-y-4'>
			<h1 className='text-xl font-bold'>Error states examples</h1>
			<ul className='space-y-3'>
				<li>
					<ThrowButton label='Throw unhandled' />
				</li>
			</ul>
		</div>
	);
}
