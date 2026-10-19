/**
 * ROUTE: /sign-in   — the sign-in page.
 *
 * A thin SERVER page: it reads two things from the server side and hands them to the form:
 *   - `?next=...`   where to go after signing in (set by proxy.ts / requireUser when they bounced you)
 *   - whether GitHub login is configured (the two environment variables exist)
 * The interactive part, the buttons, is the Client Component <AuthForm> (a button needs onClick).
 *
 * Why read the environment variables HERE and pass a boolean down? A Client Component can't see
 * `process.env.GITHUB_CLIENT_SECRET` (and must never). The server page can, and passes only the
 * harmless answer: `true` or `false`.
 *
 * ⚠️ Bugs in this snapshot: the page passes `mode="sign-up"` (copy-paste, it should be "sign-in"),
 * so it shows "Create an account", and the function is spelled `SingInPage`. The folder `sign-up/`
 * has the same shape. And <AuthForm> has no email/password fields yet, only the GitHub button.
 */
import { AuthForm } from '../_components/auth.form';
import { safeNext } from '../_components/safe-next';

export default async function SingInPage({ searchParams }: PageProps<'/sign-in'>) {
  // `searchParams` is a Promise (like `params`), so we await it. `next` can be string | string[] | undefined.
  const { next } = await searchParams;

  // The server-only environment variables never leave the server: only this boolean does.
  const githubEnabled = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

  // `safeNext` makes sure we only ever redirect to a path on THIS site (see safe-next.ts).
  return <AuthForm mode="sign-up" githubEnabled={githubEnabled} next={safeNext(next)} />;
}
