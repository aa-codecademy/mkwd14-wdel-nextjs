import { createHash, randomBytes } from 'crypto';
import { apiTokens } from '../db/schema';
import { db } from '../db';

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createApiToken(organizerId: string, label: string) {
  const token = `gatherly_${randomBytes(32).toString('base64url')}`;

  console.log('🚀 ~ createApiToken ~ token:', token);

  await db.insert(apiTokens).values({ organizerId, label, tokenHash: hash(token) });

  return token;
}
