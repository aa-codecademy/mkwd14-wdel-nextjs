'use client';
import { Button } from '../../../components/ui/button';
import { signIn } from '../../../lib/auth-client';

type AuthFormProps = {
  mode: 'sign-in' | 'sign-up';
  next: string;
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
          onClick={() => signIn.social({ provider: 'github', callbackURL: next })}
        >
          Continue with GitHub
        </Button>
      )}
    </div>
  );
}
