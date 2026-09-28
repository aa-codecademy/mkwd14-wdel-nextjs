# Gatherly — end of class 01

The course application as it stands after class 1: a fresh **Next.js 16** project (App Router, TypeScript, Tailwind CSS v4) with code-quality tooling set up. No Gatherly features yet — those start in class 2.

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
│   ├── layout.tsx        ← root layout: <html>, <body>, fonts, metadata
│   ├── page.tsx          ← the "/" route
│   ├── globals.css       ← Tailwind import + design tokens (@theme)
│   └── favicon.ico       ← picked up automatically as the site icon
├── public/               ← static files served as-is: /next.svg → public/next.svg
├── next.config.ts        ← Next.js options
├── tsconfig.json         ← TypeScript options; "@/*" import alias
├── eslint.config.mjs     ← ESLint rules (Next.js + TypeScript presets)
├── postcss.config.mjs    ← wires Tailwind into the CSS build
├── .prettier.json        ← Prettier options + Tailwind class sorting
├── .vscode/settings.json ← format on save, ESLint fix on save, workspace TypeScript
├── AGENTS.md / CLAUDE.md ← instructions for AI assistants (generated)
└── package.json          ← dependencies and scripts
```

### Why these tools?

- **TypeScript** catches mistakes (typos, wrong props, missing `await`) before you run the code.
- **ESLint** with `eslint-config-next` knows React and Next.js rules — e.g. hooks rules, using `<Image>` / `<Link>`.
- **Prettier** formats code the same way for everyone, so diffs only show real changes. `prettier-plugin-tailwindcss` sorts Tailwind classes in a consistent order.
- **`eslint-config-prettier`** turns off ESLint rules that would fight with Prettier.
- **`.vscode/settings.json`** formats on save and uses the project's TypeScript version rather than the one bundled with VS Code.
- **`engines.node >= 20.9`** in `package.json` documents the minimum Node.js version Next.js 16 needs.

## 🔗 Links

- [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [`next` CLI (dev, build, start, typegen)](https://nextjs.org/docs/app/api-reference/cli/next)
- [ESLint in Next.js](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Prettier options](https://prettier.io/docs/options) · [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
- [Class 01 README](../README.md) — concepts, exercises and more links
