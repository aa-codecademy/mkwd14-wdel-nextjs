'use server';

import z from 'zod';
import { canManageEvents } from '../../lib/roles';
import { getCurrentUser } from '../../lib/session';
import { createApiToken } from '../../lib/api-tokens';
import { revalidatePath } from 'next/cache';

export type CreateTokenState = { token?: string; error?: string };

export async function createScannerToken(
  _prev: CreateTokenState,
  formData: FormData,
): Promise<CreateTokenState> {
  const user = await getCurrentUser();
  if (!user || !canManageEvents(user.role)) {
    return {
      error: 'Only organizers can create tokens',
    };
  }

  const label = z.string().trim().min(1).max(60).safeParse(formData.get('label'));

  if (!label.success) {
    return {
      error: 'Give the token a proper label, e.g. "Front door tablet" ',
    };
  }

  const token = await createApiToken(user.id, label.data);

  revalidatePath('/dashboard');

  return {
    token,
  };
}
