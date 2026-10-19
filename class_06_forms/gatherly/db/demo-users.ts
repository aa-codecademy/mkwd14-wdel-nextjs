import 'server-only';
import { eq } from 'drizzle-orm';
import { users } from './schema';
import { db } from '.';

// TODO(sign-in): there is no sign-in yet, so "the current user" is a seeded row.
// When authentication is added, this file is deleted and every action reads the real session instead.
//
// WHY THIS FILE EXISTS: a Server Action must know WHO is acting (the organizer of the new event).
// It must come from the server (the session), never from the form. Until sign-in exists, this
// "pretend login" lets us build the whole flow with the right shape, and swapping it for the
// real thing later means changing one line per action.
//
// ⚠️ It looks users up by `handle` ('avenga', 'demo-attendee'). Those rows must exist, and the
// seed script of this snapshot doesn't create them (it makes random users). Without them the
// create-event form throws "Demo user ... not found". See the class README for the 2-row fix.

// Finds a user by their (unique) handle, or fails loudly with a message that says how to fix it.
async function byHandle(handle: string) {
  const user = await db.query.users.findFirst({ where: eq(users.handle, handle) });
  if (!user) throw new Error(`Demo user "${handle}" not found. Run: npm run db:seed`);
  return user;
}

/** The organizer the dashboard acts as. */
export const getDemoOrganizer = () => byHandle('avenga');

/** The attendee who reserves tickets. */
export const getDemoAttendee = () => byHandle('demo-attendee');
