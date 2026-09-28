import Link from 'next/link';
import type { ReactNode } from 'react';
import Counter from './counter';

export default function NestedLayout({ children }: { children: ReactNode }) {
	return (
		<div className='rounded border-2 border-dashed border-blue-400 p-4'>
			<h2 className='font-bold'>Nested route layout</h2>
			<div>
				<Counter />
			</div>
			<div className='mt-2 flex items-center gap-4'>
				<Link href='/routing/nested'>Nested (/nested)</Link>
				<Link href='/routing/nested/deeper'>Deeper route (/nested/deeper)</Link>
			</div>
			<div className='mt-4 rounded bg-gray-100 p-4'>{children}</div>
		</div>
	);
}
