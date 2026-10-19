import { headers } from 'next/headers';
import { auth } from '../db/auth';
import { redirect } from 'next/navigation';
import { canManageEvents } from './roles';

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}

export async function requireUser(returnTo: string) {
  const user = await getCurrentUser();

  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);

  return user;
}

export async function requireOrganizer(returnTo: string) {
  const user = await requireUser(returnTo);

  if (!canManageEvents(user.role)) redirect('/organizers-only');

  return user;
}
