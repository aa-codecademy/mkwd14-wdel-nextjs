'use client';

import { useDebouncedCallback } from 'use-debounce';
import { Input } from './ui/input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = useDebouncedCallback((value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set('q', value.trim());
    } else {
      next.delete('q');
    }

    const query = next.toString();

    router.replace(query ? `${pathname}?${query}` : pathname);
  }, 500);

  return (
    <Input
      placeholder="Search events..."
      type="search"
      name="q"
      defaultValue={searchParams.get('q') ?? ''}
      aria-label="Search events"
      className="h-10"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
