export default function NotFound() {
	return (
		<div className='rounded border-2 border-gray-400 bg-gray-50 p-4'>
			<h1>404 - Not found</h1>
			<p className='mt-2'>
				No such thing. notFound() was called, so this rendered — with a 404
				status.
			</p>
		</div>
	);
}
