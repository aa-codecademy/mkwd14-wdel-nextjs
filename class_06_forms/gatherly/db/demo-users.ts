import 'server-only';
import { eq } from 'drizzle-orm';
import { users } from './schema';
import { db } from '.';

// TODO(class 06): there is no sign-in yet, so "the current user" is a seeded row.
// Class 06 deletes this file and reads the real session instead — in every action.

async function byHandle(handle: string) {
  const user = await db.query.users.findFirst({ where: eq(users.handle, handle) });
  if (!user) throw new Error(`Demo user "${handle}" not found. Run: npm run db:seed`);
  return user;
}

/** The organizer the dashboard acts as. */
export const getDemoOrganizer = () => byHandle('avenga');

/** The attendee who reserves tickets. */
export const getDemoAttendee = () => byHandle('demo-attendee');
