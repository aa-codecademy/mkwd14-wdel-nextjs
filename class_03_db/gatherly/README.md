# Gatherly — end of class 02

The course application as it stands after class 2: a **Next.js 16** project (App Router, TypeScript, Tailwind CSS v4) with a shared layout (header and footer), Gatherly's brand design tokens, a landing page, and an `/events` page that renders typed **mock data** as a grid of cards with optimised remote images. The database replaces the mock data in class 3.

| Route                                     | File                  |
| ----------------------------------------- | --------------------- |
| [/](http://localhost:3000)                | `app/page.tsx`        |
| [/events](http://localhost:3000/events)   | `app/events/page.tsx` |

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 📜 Scripts

| Command                | What it does                                                        |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Dev server with hot reload (Turbopack)                              |
| `npm run build`        | Production build — also type-checks and shows static/dynamic routes |
| `npm run start`        | Serves the production build (run `build` first)                     |
| `npm run lint`         | ESLint — finds bugs and bad patterns                                |
| `npm run lint:fix`     | ESLint, fixing what it can automatically                            |
| `npm run format`       | Prettier — formats every file                                       |
| `npm run format:check` | Prettier — only reports unformatted files (used in CI / homework)   |
| `npm run check`        | Type check + lint + format check. Run before every push.            |

## 🗂 Project structure

```
gatherly/
├── app/                  ← the App Router: folders = URLs
│   ├── layout.tsx        ← root layout: <html>, <body>, Inter font, metadata, Header + Footer
│   ├── page.tsx          ← the "/" route (landing page)
│   ├── events/page.tsx   ← the "/events" route
│   ├── globals.css       ← Tailwind import + brand design tokens (@theme)
│   └── favicon.ico       ← picked up automatically as the site icon
├── components/           ← shared UI (not routes): header, footer, event grid, event card
├── types/                ← TypeScript types for our data: GatherlyEvent, Venue, Category, …
├── mocks/                ← fake data used until we have a database (class 03)
├── public/               ← static files served as-is: /next.svg → public/next.svg
├── next.config.ts        ← Next.js options (allowed remote image hosts)
├── tsconfig.json         ← TypeScript options; "@/*" import alias; extra strict checks
├── eslint.config.mjs     ← ESLint rules (Next.js + TypeScript presets + our own rules)
├── postcss.config.mjs    ← wires Tailwind into the CSS build
├── .prettierrc.json      ← Prettier options + Tailwind class sorting
├── .nvmrc                ← Node version for nvm (`nvm use`)
├── .vscode/              ← format on save, ESLint fix on save, recommended extensions
├── .claude/ .cursor/ .github/ ← project rules for AI assistants (Claude Code, Cursor, Copilot)
├── AGENTS.md / CLAUDE.md ← entry points for AI assistants
└── package.json          ← dependencies and scripts
```
### Why these tools?

- **TypeScript** catches mistakes (typos, wrong props, missing `await`) before you run the code.
- **ESLint** with `eslint-config-next` knows React and Next.js rules — e.g. hooks rules, using `<Image>` / `<Link>`.
- **Prettier** formats code the same way for everyone, so diffs only show real changes. `prettier-plugin-tailwindcss` sorts Tailwind classes in a consistent order.
- **`eslint-config-prettier`** turns off ESLint rules that would fight with Prettier.
- **`.vscode/settings.json`** formats on save and uses the project's TypeScript version rather than the one bundled with VS Code.
- **`engines.node >= 20.9`** in `package.json` documents the minimum Node.js version Next.js 16 needs. `.nvmrc` lets `nvm use` pick the right version.
- **Stricter `tsconfig.json`**: `noUncheckedIndexedAccess` makes `array[0]` possibly `undefined`, so you have to handle the "not found" case.
- **Extra ESLint rules**: `import type` for type-only imports, `===` instead of `==`, warnings for leftover `console.log`, and unused variables are errors (prefix with `_` to allow one on purpose).
- **AI assistant rules** (`.claude/rules`, `.cursor/rules`, `.github/copilot-instructions.md`): the same project rules in each tool's format. They pin the versions we use and stop assistants from suggesting outdated Next.js 14 / Tailwind 3 code. AI is welcome, but you must understand every line it writes.

## 🔗 Links

- [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [`next` CLI (dev, build, start, typegen)](https://nextjs.org/docs/app/api-reference/cli/next)
- [ESLint in Next.js](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Prettier options](https://prettier.io/docs/options) · [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
- [`next/image` remotePatterns](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)
- [Class 02 README](../README.md) — concepts, exercises and more links
