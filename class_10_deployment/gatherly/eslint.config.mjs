import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';

// ESLint "flat config": an array of config objects, applied in order.
// Later entries override earlier ones.
const eslintConfig = defineConfig([
  // Next.js presets: React + hooks rules, Next.js rules (use <Link>, <Image>, ...),
  // Core Web Vitals checks and TypeScript rules.
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      // `import type` for type-only imports — keeps the server/client boundary honest (class 02)
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],

      // unused vars are errors, but `_prev` / `_req` are allowed (Server Action + Route Handler signatures)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // always === / !== (never ==, which converts types: 0 == '' is true)
      eqeqeq: ['error', 'always'],
      // console.log is a warning (remove debug logs before pushing); console.warn/error are OK
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // must be LAST: switches off every ESLint rule that would fight Prettier over formatting
  prettier,
  // generated folders/files that should never be linted
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'drizzle/**']),
]);

export default eslintConfig;
