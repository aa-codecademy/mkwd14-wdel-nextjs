import Link from 'next/link';

export default function EventsLayout({ children }: LayoutProps<'/events'>) {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/events" className="hover:text-foreground">
          Events
        </Link>
      </nav>
      {children}
    </div>
  );
}
