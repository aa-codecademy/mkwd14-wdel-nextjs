# ▲ Full Stack Development with Next.js

Repository for learning **Next.js** — building a full-stack web application with React, TypeScript, Tailwind CSS and PostgreSQL, from the App Router and Server Components through data, forms, authentication, caching and deployment. No separate backend: everything runs in Next.js.

Over the course we build one real application together: **Gatherly**, an event and ticketing platform.

---

## 📋 Course overview

|             |                                                 |
| ----------- | ----------------------------------------------- |
| **Trainer** | Ivo Kostovski                                   |
| **Email**   | [ivo@kostovski.dev](mailto:ivo@kostovski.dev)   |
| **Web**     | [kostovski.dev](https://kostovski.dev)          |
| **GitHub**  | [ivokostovski](https://github.com/ivokostovski) |

---

## 📚 Topics

- **Next.js fundamentals** — App Router, file-based routing, layouts, rendering models (SSR, SSG, React Server Components)
- **Server & Client Components** — where code runs, `"use client"`, composition, streaming with `<Suspense>`
- **Styling** — Tailwind CSS v4, design tokens with `@theme`, shadcn/ui components
- **Database** — PostgreSQL, schema design, Drizzle ORM, migrations and seeding
- **Routing in depth** — dynamic routes, route groups, search params, filtering and pagination
- **Server Actions & forms** — mutations without an API, validation with Zod, optimistic UI
- **Authentication & authorization** — Better Auth, sessions, OAuth with GitHub, roles, protecting pages and actions
- **Caching & rendering** — Cache Components, `"use cache"`, Partial Prerendering, revalidation
- **Route Handlers & APIs** — REST endpoints, webhooks, file downloads
- **Advanced routing & SEO** — parallel and intercepting routes, metadata, Open Graph images, sitemap
- **Quality & deployment** — performance, testing, accessibility, deploying to Vercel with a real database
- **AI in the workflow** — scaffolding, explaining errors, reviewing code (always with human validation)

---

## 🛠 Tools

| Tool               | Link                                                               |
| ------------------ | ------------------------------------------------------------------ |
| **VS Code**        | [code.visualstudio.com](https://code.visualstudio.com/)            |
| **Node.js**        | [nodejs.org](https://nodejs.org/) — **version 20.9 or newer**      |
| **Git**            | [git-scm.com](https://git-scm.com/)                                |
| **PostgreSQL**     | [postgresql.org](https://www.postgresql.org/download/)             |
| **pgAdmin**        | [pgadmin.org](https://www.pgadmin.org/)                            |
| **Vercel**         | [vercel.com](https://vercel.com/)                                  |
| **GitHub Copilot** | [github.com/features/copilot](https://github.com/features/copilot) |
| **ChatGPT**        | [chat.openai.com](https://chat.openai.com/)                        |
| **Claude**         | [claude.ai](https://claude.ai/)                                    |

*Use **Node.js** and **npm** to install dependencies and run the examples in each class folder: `npm install`, then `npm run dev`.*

---

## 📦 Packages we use

| Package                                                                | Version    | What it's for                                     |
| ---------------------------------------------------------------------- | ---------- | ------------------------------------------------- |
| **[Next.js](https://nextjs.org/)**                                     | 16.3       | The framework — routing, rendering, server code   |
| **[React](https://react.dev/)**                                        | 19.3       | UI components                                     |
| **[TypeScript](https://www.typescriptlang.org/)**                      | 6.0        | Types                                             |
| **[Tailwind CSS](https://tailwindcss.com/)**                           | 4.3        | Styling                                           |
| **[shadcn/ui](https://ui.shadcn.com/)**                                | CLI 4.x    | Ready-made components you copy into your project  |
| **[Drizzle ORM](https://orm.drizzle.team/)**                           | 0.45       | Talking to PostgreSQL from TypeScript             |
| **[Better Auth](https://www.better-auth.com/)**                        | 1.7        | Sign-up, sign-in, sessions, roles                 |
| **[Zod](https://zod.dev/)**                                            | 4.x        | Validating form data and inputs                   |
| **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** | 9.x + 3.x | Catching bugs and formatting code                 |

> ⚠️ **Some of these are deliberately *not* the latest version.** TypeScript 7 and ESLint 10 exist, but the Next.js lint tools don't support them yet — installing them makes `npm run lint` crash. We use the newest versions that **work together**. Before upgrading anything, check what it supports: `npm view <package> peerDependencies`.

> ⚠️ **Most tutorials online are for older versions.** If something from a tutorial or an AI assistant doesn't work, check the version first. The usual suspects: `middleware.ts` (now `proxy.ts`), `params` used without `await`, a `tailwind.config.js` (Tailwind 4 doesn't use one), and NextAuth (we use Better Auth). When asking an AI, always say **"Next.js 16, App Router"**.

---

## 🔌 VS Code extensions for Next.js & TypeScript

Built-in **JavaScript and TypeScript** support in VS Code covers syntax highlighting, IntelliSense, and Go to Definition. These extensions complement it for day-to-day Next.js work:

| Extension                                                                                                                       | Why use it                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)**                                        | Lint `.ts` / `.tsx` files with project rules; catches many issues before run time. |
| **[Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)**                                      | Consistent formatting; pair with "Format on Save" in settings.                     |
| **[Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)**                  | Autocomplete, hover previews and linting for Tailwind classes.                     |
| **[Pretty TypeScript Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)**                    | Easier-to-read TypeScript error messages (great while learning).                   |
| **[Prettify TypeScript: Better Type Previews](https://marketplace.visualstudio.com/items?itemName=MylesMurphy.prettify-ts)**    | Nicer hover previews for complex types (generics, nested objects, utilities).      |
| **[Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens)**                                      | Shows errors and warnings inline in the editor.                                    |
| **[Path Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.path-intellisense)**                 | Autocompletes file paths in `import` statements.                                   |
| **[npm Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.npm-intellisense)**                   | Autocompletes package names when importing from `node_modules`.                    |

*Optional:* **[Import Cost](https://marketplace.visualstudio.com/items?itemName=wix.vscode-import-cost)** shows import size hints — useful when you get to Client Components and bundle size.

---

## 📂 Homeworks

All homework instructions live in the [`homeworks/`](./homeworks) folder. Each assignment has its own README there.

---

## 📁 Class materials

In-class examples and exercises are organized by session (e.g. `class_01_introduction/`). Each class folder can contain:

- **`gatherly/`** — the course application as it stands at the end of that class. Fell behind? Start the next class from here.
- **`examples/`** — small standalone apps that show one concept in isolation.

To run any of them:

```bash
cd class_01_introduction/gatherly
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## 🚀 Continuing after this course

Done with the Next.js classes but want to keep learning?

- [Next.js docs](https://nextjs.org/docs) and the [Next.js Learn course](https://nextjs.org/learn)
- [React docs](https://react.dev/learn) — especially *Thinking in React* and the hooks reference
- [Drizzle ORM docs](https://orm.drizzle.team/docs/overview) and [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- Testing with [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/)
- Build your own project end to end and deploy it — that's what employers want to see
