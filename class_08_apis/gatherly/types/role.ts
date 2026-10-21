// The three roles, as a union of literals. TypeScript then flags a typo like 'organiser'.
// (The `user.role` column is plain text, see lib/roles.ts for how it's turned into this type.)
export type Role = 'attendee' | 'organizer' | 'admin';
