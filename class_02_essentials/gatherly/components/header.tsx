import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-brand-900">
          Gatherly
        </Link>
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/events" className="hover:text-brand-500">
            Events
          </Link>
        </nav>
      </div>
    </header>
  );
}
