import type { Role } from '../types/role';

export function parseRole(value: string | null | undefined): Role {
  return value === 'organizer' || value === 'admin' ? value : 'attendee';
}

export function canManageEvents(role: string | null | undefined): boolean {
  const parsed = parseRole(role);

  return parsed === 'organizer' || parsed === 'admin';
}
