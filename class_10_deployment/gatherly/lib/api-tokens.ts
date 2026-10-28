/**
 * API TOKENS: long-lived passwords for DEVICES (a tablet at the door) so they can call our API
 * without a person logging in. They are handled like passwords:
 *
 *   - random and unguessable: 32 bytes from a cryptographically secure generator,
 *   - shown to the organizer ONCE, at creation,
 *   - stored only as a HASH (api_tokens.token_hash). If the database leaks, the attacker gets hashes,
 *     not working tokens. To check a request: hash the token it sends and look that hash up.
 *   - revocable (api_tokens.revoked_at), because tablets get lost.
 *
 * A fast SHA-256 is fine here (unlike for human passwords, which need a slow hash like bcrypt):
 * the token is 256 bits of randomness, so there is nothing to brute-force or look up in a rainbow table.
 */
import { createHash, randomBytes } from 'crypto';
import { apiTokens } from '../db/schema';
import { db } from '../db';

// token -> 64 hex characters. The same input always gives the same hash, which is what lets us look it up.
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

// Creates a token for `organizerId` and returns the PLAIN token. That return value is the only copy that
// will ever exist: hand it to the user right away. `label` is a human name ("Front door tablet").
export async function createApiToken(organizerId: string, label: string) {
  // The `gatherly_` prefix makes tokens recognizable (in logs, in secret scanners). base64url = safe in URLs and headers.
  const token = `gatherly_${randomBytes(32).toString('base64url')}`;

  // ⚠️ Leftover debug line: it writes the PLAIN token to the server logs, which defeats storing only a hash.
  // Anyone with log access (hosting dashboard, log drains) could use it. Delete it before real use.
  console.log('🚀 ~ createApiToken ~ token:', token);

  // Only the hash goes to the database. `lastUsedAt` and `revokedAt` stay null until a request uses / we revoke it.
  await db.insert(apiTokens).values({ organizerId, label, tokenHash: hash(token) });

  return token;
}
