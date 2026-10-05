import { notFound } from 'next/navigation';

export default async function IDPage({
	params,
}: PageProps<'/error-examples/[id]'>) {
	const { id } = await params;

	if (id === '123') {
		notFound();
	}
	
	return <div>some product with id that exists</div>;
}
