'use client';

import { useRouter } from 'next/navigation';
import { signOut, useSession } from '../lib/auth-client';
import Link from 'next/link';
import { canManageEvents } from '../lib/roles';

export function AccountMenu() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) return <span className="w-16" aria-hidden />;

  if (!session) {
    return (
      <Link href="/sign-in" className="hover:text-brand-500">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {canManageEvents(session.user.role) && (
        <Link href="/dashboard" className="hover:text-brand-500">
          Dashboard
        </Link>
      )}

      <span className="text-muted-foreground">{session.user.name}</span>
      <button
        className="cursor-pointer hover:text-brand-500"
        onClick={async () => {
          await signOut();
          router.refresh();
        }}
      >
        Sign out
      </button>
    </div>
  );
}
