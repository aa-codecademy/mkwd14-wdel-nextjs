/**
 * ROLES — the vocabulary of AUTHORIZATION.
 *
 * Authentication told us WHO the user is. A role says what that kind of user MAY DO:
 *   attendee   browse events, buy tickets             (everyone who signs up)
 *   organizer  also create and manage events          (the dashboard)
 *   admin      everything an organizer can, and more  (managing users)
 *
 * The role lives in the `user.role` column as plain text. Everything that decides "may this user
 * do X?" goes through the small functions here, so the rule is written ONCE. Compare with the
 * queries file in class 4: one place to change.
 */
import type { Role } from '../types/role';

// The database column is just text, so it could hold anything (a typo, an old value). This turns
// ANY string into a valid Role, and falls back to the LEAST powerful one. That's a safe default:
// when in doubt, give the user fewer rights, never more.
export function parseRole(value: string | null | undefined): Role {
  return value === 'organizer' || value === 'admin' ? value : 'attendee';
}

// "May this user create and manage events?" Used in three places: lib/session.ts (the real guard),
// components/account-menu.tsx (to show or hide the Dashboard link: only a convenience).
export function canManageEvents(role: string | null | undefined): boolean {
  const parsed = parseRole(role);

  return parsed === 'organizer' || parsed === 'admin';
}
