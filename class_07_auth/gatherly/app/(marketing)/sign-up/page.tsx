import { AuthForm } from '../_components/auth.form';
import { safeNext } from '../_components/safe-next';

export default async function SingUpPage({ searchParams }: PageProps<'/sign-up'>) {
  const { next } = await searchParams;

  const githubEnabled = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

  return <AuthForm mode="sign-up" githubEnabled={githubEnabled} next={safeNext(next)} />;
}
