export default async function Page({ params }: PageProps<'/routing/[id]'>) {
	const { id } = await params;

	return (
		<div>
			Dynamic page. Param value: <strong>{id}</strong>
		</div>
	);
}
