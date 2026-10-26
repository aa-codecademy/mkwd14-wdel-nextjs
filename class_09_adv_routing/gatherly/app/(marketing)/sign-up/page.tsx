/**
 * ROUTE: /sign-up   — the "create an account" page. Same shape as /sign-in (see that file):
 * a server page that reads `?next=` and whether GitHub login is set up, and renders <AuthForm>.
 *
 * With GitHub there is little difference between "sign in" and "sign up": the first time, Better Auth
 * creates the user and the `account` row; later it finds them. With email + password the two are
 * different forms (sign-up asks for a name too), which is why there are two pages.
 */
import { AuthForm } from '../_components/auth.form';
import { safeNext } from '../_components/safe-next';

export default async function SingUpPage({ searchParams }: PageProps<'/sign-up'>) {
  const { next } = await searchParams;

  // See the comment in sign-in/page.tsx: the server decides, the browser only gets a boolean.
  const githubEnabled = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

  return <AuthForm mode="sign-up" githubEnabled={githubEnabled} next={safeNext(next)} />;
}
