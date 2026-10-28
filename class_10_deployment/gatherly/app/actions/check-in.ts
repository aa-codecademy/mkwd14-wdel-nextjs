'use server';

/**
 * SERVER ACTION: check a ticket in from the /dashboard/check-in page.
 *
 * ⚠️ A Server Action is a PUBLIC endpoint: hiding the form from attendees (CheckInGate) is not protection,
 * so this function checks the caller itself. The rules live in lib/check-in.ts, shared with the API
 * that scanner tokens use, so both doors behave the same.
 */
import { z } from 'zod';
import { formatEventDate } from '@/lib/format';
import { canManageEvents } from '@/lib/roles';
import { getCurrentUser } from '@/lib/session';
import { checkIn } from '../../lib/check-in';

// `ok` is a ready-to-show success message, `error` a failure message. Only one is set at a time.
export type CheckInState = { ok?: string; error?: string };

// The door, as a page: the organizer is signed in on this device, so the session
// cookie identifies them — no token, no API. Same rules as /api/check-in.
export async function checkInTicket(
  _prev: CheckInState,
  formData: FormData,
): Promise<CheckInState> {
  // Authenticate + authorize. The check-in rules also compare the ticket's event owner with `user.id`.
  const user = await getCurrentUser();
  if (!user || !canManageEvents(user.role))
    return { error: 'Only organizers can check tickets in' };

  // Validate: the code is whatever the client sent. An empty string would only produce a confusing "No such ticket".
  const code = z.string().trim().min(1).safeParse(formData.get('code'));
  if (!code.success) return { error: 'Type the code printed on the ticket' };

  // All business rules (exists? yours? paid? first time?) happen inside checkIn(). We only translate the
  // result into a message; the HTTP status codes in the result matter for the API, not for this form.
  const result = await checkIn(code.data, user.id);
  if (!result.ok) return { error: result.message };

  // No revalidatePath here: the dashboard's "Checked in" tile is only refreshed on the next visit to /dashboard.
  return {
    ok: `${result.attendee} — ${result.ticketType}, ${result.event} (${formatEventDate(result.checkedInAt)})`,
  };
}
