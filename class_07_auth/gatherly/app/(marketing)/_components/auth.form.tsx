/**
 * AuthForm — the sign-in / sign-up screen. A CLIENT component, because the button has an onClick.
 *
 * What the GitHub button does, step by step ("OAuth", the same flow behind every "Continue with ..." button):
 *
 *   1. onClick -> `signIn.social({ provider: 'github', callbackURL: next })`
 *   2. The auth client asks our server (/api/auth/sign-in/social) to start. The server answers
 *      with GitHub's authorization URL, and the browser is sent to github.com.
 *   3. On GitHub the user logs in (if needed) and clicks "Authorize". Gatherly never sees the password.
 *   4. GitHub sends the browser back to OUR callback URL, /api/auth/callback/github, with a one-time code.
 *   5. Our server swaps the code for the user's profile (name, email, avatar), using the client SECRET.
 *      It creates (or finds) the `user` and `account` rows, creates a `session` row, and sets the cookie.
 *   6. The browser lands on `callbackURL` (the `next` page).
 *
 * The client id and secret you get when you register the OAuth app are what identify OUR app to GitHub
 * in step 5. See the class 07 README, "Getting the GitHub credentials".
 *
 * ⚠️ Not finished: the page has a title and a GitHub button, but no email / password fields, so
 * the `emailAndPassword` setting in db/auth.ts has no screen yet. (Hint: `signIn.email(...)` and
 * `signUp.email(...)` from lib/auth-client.ts.) If GitHub isn't configured, the page is empty.
 */
'use client';
import { Button } from '../../../components/ui/button';
import { signIn } from '../../../lib/auth-client';

type AuthFormProps = {
  // Which page this is. Only the title uses it for now.
  mode: 'sign-in' | 'sign-up';
  // Where to go afterwards. Already made safe by the page (safeNext).
  next: string;
  // Computed on the server, so the browser never sees the secrets. false = hide the GitHub button.
  githubEnabled: boolean;
};

export function AuthForm({ mode, next, githubEnabled }: AuthFormProps) {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-brand-900">
        {mode === 'sign-up' ? 'Create an account' : 'Sign in'}
      </h1>
      {githubEnabled && (
        <Button
          variant="outline"
          size="lg"
          className="mt-3 w-full"
          // `callbackURL`: where to land after the whole round trip to GitHub and back.
          onClick={() => signIn.social({ provider: 'github', callbackURL: next })}
        >
          Continue with GitHub
        </Button>
      )}
    </div>
  );
}
