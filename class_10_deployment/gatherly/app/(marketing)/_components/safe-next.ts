/**
 * safeNext — turns the `?next=` URL parameter into somewhere SAFE to send the user.
 *
 * After sign-in we send people back to the page they wanted: /sign-in?next=/dashboard. But `next`
 * comes from the URL, so it is USER INPUT: someone could send a victim the link
 *   /sign-in?next=https://evil.example
 * and, if we obeyed, the victim would sign in on OUR site and land on THEIRS, looking trusted.
 * That attack is called an OPEN REDIRECT.
 *
 * The rule: only allow a path on THIS site. A path starts with exactly one "/".
 *   "/dashboard"          ✅
 *   "https://evil.com"    ❌ (doesn't start with "/")
 *   "//evil.com"          ❌ (starts with "//": browsers treat it as "another site")
 * Anything else becomes "/" (the home page).
 *
 * ⚠️ One hole is left: browsers also treat a backslash like a slash, so "/\evil.com" is read as
 * "//evil.com" and passes the check. A stricter version also rejects any "\" in the value.
 */
export function safeNext(value: string | string[] | undefined): string {
  // A repeated parameter (?next=a&next=b) is an array: take the first value, as in lib/event-filters.ts.
  const next = Array.isArray(value) ? value[0] : value;
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}
