<!-- Generated from tools/agent-rules in the course repo. Edit the source, not this file. -->

# TypeScript and tooling rules

## TypeScript

- `strict` is on, plus `noUncheckedIndexedAccess`: `array[0]` and `record[key]` are `T | undefined`. Handle the `undefined` case (early return, `notFound()`, a default) — do not silence it with `!`.
- Prefer `type` over `interface`, consistently.
- No `any`. Use `unknown` and narrow it, or the real type.
- Type-only imports use inline `type`: `import { type ReactNode } from "react"`.
- Once the database exists, **infer types from the Drizzle schema** (`typeof events.$inferSelect`) instead of hand-writing duplicate types.
- Do not add `baseUrl` to `tsconfig.json` — it is deprecated in TypeScript 6. `paths` works without it.
- `switch` statements need a `break` or `return` in every `case`.
- Match the real casing of file names in imports (`./event-card`, not `./Event-Card`). macOS forgives it; Linux deploys don't.

## ESLint (flat config in `eslint.config.mjs`)

The project enforces, and your code must satisfy:

- `@typescript-eslint/consistent-type-imports` — `import { type X }`
- `@typescript-eslint/no-unused-vars` — unused variables are errors; prefix intentionally unused ones with `_` (`_prev`, `_request`)
- `eqeqeq` — always `===` / `!==`
- `no-console` — `console.log` is a warning; `console.warn` / `console.error` are allowed
- Next's `core-web-vitals` and `typescript` rule sets

Do not disable rules with `eslint-disable` comments to make an error go away — fix the cause. Never create `.eslintrc*` files; ESLint 9 uses flat config only.

## Tests (from class 10)

- `npm test` runs Vitest unit tests in `tests/unit/`; `PORT=… npm run test:e2e` runs Playwright against a production build (the port must match `BETTER_AUTH_URL`).
- Keep what you want to test importable: schemas live in `lib/validation/`, never only inside a `"use server"` file.
- Query by role and label (`getByRole`, `getByLabel`) — the same queries a screen reader makes. If a control can't be found that way, fix the markup, not the test.
- Never set `E2E=1` outside test runs: it exposes Next's testing API.

## Prettier

- Prettier owns formatting (with `prettier-plugin-tailwindcss` sorting class names). Don't hand-format or argue with it; run `npm run format`.
- Do not add `eslint-plugin-prettier`. Prettier and ESLint run as separate tools.
- Don't change `.prettierrc.json`, `eslint.config.mjs` or `tsconfig.json` unless asked.
