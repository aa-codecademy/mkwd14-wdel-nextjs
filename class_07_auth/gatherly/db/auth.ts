import 'server-only';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import { db } from '.';
import * as schema from '../db/auth-schema';
import { admin } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';

const github =
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
  socialProviders: github,
  user: {
    additionalFields: {
      handle: { type: 'string', required: false, unique: true, input: false },
    },
  },
  plugins: [admin({ defaultRole: 'attendee', adminRoles: ['admin'] }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session['user'];
