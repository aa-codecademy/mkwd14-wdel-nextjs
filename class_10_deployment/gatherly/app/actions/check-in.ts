'use server';

import { z } from 'zod';
import { formatEventDate } from '@/lib/format';
import { canManageEvents } from '@/lib/roles';
import { getCurrentUser } from '@/lib/session';
import { checkIn } from '../../lib/check-in';

export type CheckInState = { ok?: string; error?: string };

// The door, as a page: the organizer is signed in on this device, so the session
// cookie identifies them — no token, no API. Same rules as /api/check-in.
export async function checkInTicket(
  _prev: CheckInState,
  formData: FormData,
): Promise<CheckInState> {
  const user = await getCurrentUser();
  if (!user || !canManageEvents(user.role))
    return { error: 'Only organizers can check tickets in' };

  const code = z.string().trim().min(1).safeParse(formData.get('code'));
  if (!code.success) return { error: 'Type the code printed on the ticket' };

  const result = await checkIn(code.data, user.id);
  if (!result.ok) return { error: result.message };

  return {
    ok: `${result.attendee} — ${result.ticketType}, ${result.event} (${formatEventDate(result.checkedInAt)})`,
  };
}
