'use server';

/**
 * SERVER ACTION: create a scanner API token (the form is create-scanner-token.tsx on /dashboard).
 *
 * ⚠️ Remember: a Server Action is a PUBLIC endpoint. The order is the usual one: authenticate ->
 * authorize -> validate -> change data -> revalidate -> return. The token is created for the SIGNED-IN
 * user (`user.id` from the session), never for an id sent by the form.
 *
 * Errors are RETURNED ({ error }), not thrown, so useActionState can show them next to the form.
 */
import z from 'zod';
import { canManageEvents } from '../../lib/roles';
import { getCurrentUser } from '../../lib/session';
import { createApiToken } from '../../lib/api-tokens';
import { revalidatePath } from 'next/cache';

// What the form gets back. `token` appears only on success and only this once; it can't be fetched later.
export type CreateTokenState = { token?: string; error?: string };

export async function createScannerToken(
  _prev: CreateTokenState,
  formData: FormData,
): Promise<CreateTokenState> {
  // 1. Authenticate + authorize. We use getCurrentUser (not requireOrganizer) because requireOrganizer
  // redirects, and here we'd rather answer with a message the form can show.
  const user = await getCurrentUser();
  if (!user || !canManageEvents(user.role)) {
    return {
      error: 'Only organizers can create tokens',
    };
  }

  // 2. Validate: the label is free text from the client. trim() removes stray spaces, then 1-60 characters.
  const label = z.string().trim().min(1).max(60).safeParse(formData.get('label'));

  if (!label.success) {
    return {
      error: 'Give the token a proper label, e.g. "Front door tablet" ',
    };
  }

  // 3. Create it. The plain token comes back here, and only here.
  const token = await createApiToken(user.id, label.data);

  // 4. The tokens list on /dashboard is server-rendered, so tell Next.js it is stale and the new token shows up.
  revalidatePath('/dashboard');

  return {
    token,
  };
}
