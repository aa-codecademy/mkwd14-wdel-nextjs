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

*Use **Node.js** and **npm** to install dependencies and run the examples in each class folder: `npm install`, then `npm run dev`. First time? Follow the [local setup](#-local-setup--step-by-step) below.*

---

## 🖥 Local setup — step by step

Do this once on your machine before class 1. Commands are the same on macOS, Linux and Windows unless noted (on Windows, use **PowerShell** or the VS Code terminal).

### 1. Install Node.js (20.9 or newer)

Next.js runs on Node.js, and `npm` (the package manager) comes with it.

- Download the **LTS** version from [nodejs.org](https://nodejs.org/) and install it, **or**
- use a version manager (recommended if you work on several projects): [nvm](https://github.com/nvm-sh/nvm) on macOS/Linux, [nvm-windows](https://github.com/coreybutler/nvm-windows) or [fnm](https://github.com/Schniz/fnm) on Windows.

Check it in a **new** terminal window:

```bash
node -v   # should print v20.9.0 or higher
npm -v
```

### 2. Install Git and VS Code

- [Git](https://git-scm.com/) — check with `git --version`. Then tell Git who you are (once):

  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "you@example.com"
  ```

- [VS Code](https://code.visualstudio.com/) — then install the extensions from the [VS Code extensions](#-vs-code-extensions-for-nextjs--typescript) section below. On macOS, run *Shell Command: Install 'code' command in PATH* from the Command Palette (`Cmd+Shift+P`) so you can open folders with `code .`.

### 3. Create a new Next.js project

Go to the folder where you keep your projects and run `create-next-app`:

```bash
npx create-next-app@latest gatherly
```

`npx` downloads and runs the latest `create-next-app` without installing it globally. You will be asked:

```txt
Would you like to use the recommended Next.js defaults?
  ❯ Yes, use recommended defaults - TypeScript, ESLint, Tailwind CSS, App Router, AGENTS.md
```

Choose **Yes, use recommended defaults**. That gives you exactly the setup we use in the course. If you pick *customize settings*, answer: TypeScript **Yes**, linter **ESLint**, Tailwind CSS **Yes**, `src/` directory **No**, App Router **Yes**, import alias **`@/*`**.

> 💡 Add `--yes` to skip the questions and use the defaults: `npx create-next-app@latest gatherly --yes`

This creates a `gatherly/` folder, adds the starter files and runs `npm install` for you.

### 4. Run the development server

```bash
cd gatherly
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the Next.js starter page.

- Edit `app/page.tsx` and save. The browser updates straight away (**hot reload**).
- Stop the server with `Ctrl+C` in the terminal.
- Port 3000 already in use? Next.js picks the next free port (3001, …). Check the terminal output for the URL.

### 5. Open it in VS Code

```bash
code .
```

Open a terminal inside VS Code with ``Ctrl+` `` so the editor and `npm run dev` sit side by side.

### 6. Make it a Git repository and push to GitHub

`create-next-app` already ran `git init` and made the first commit (unless you created it inside another Git repository). Create an **empty** repository on [GitHub](https://github.com/new) (no README, no .gitignore), then:

```bash
git remote add origin https://github.com/<your-username>/gatherly.git
git branch -M main
git push -u origin main
```

`node_modules/` and `.next/` are already in `.gitignore`. Never commit them: they are generated, and anyone can recreate them with `npm install` / `npm run dev`.

### Running a project you cloned (like the ones in this repo)

A cloned project has no `node_modules/`, so install the dependencies first:

```bash
git clone <repo-url>
cd <repo>/class_01_intro/gatherly
npm install        # reads package.json + package-lock.json, creates node_modules/
npm run dev
```

### The four commands you'll use all the time

| Command         | When                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------- |
| `npm install`   | After cloning, or when `package.json` changed (e.g. after `git pull`)                     |
| `npm run dev`   | While coding. Fast, hot reload, detailed errors                                           |
| `npm run build` | To check the production build. Finds type errors and shows which routes are static or dynamic |
| `npm run start` | Runs the production build locally (after `build`)                                          |

### Troubleshooting

| Problem                                             | Fix                                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `node: command not found` / `'node' is not recognized` | Close the terminal and open a new one after installing Node. Still failing? Reinstall and restart your computer. |
| `You are using Node.js 18… Next.js requires >=20.9` | Update Node.js (step 1). With nvm: `nvm install --lts && nvm use --lts`               |
| `Module not found` right after cloning               | You forgot `npm install`.                                                             |
| Strange errors after switching branches or upgrading | Stop the server, delete `.next/` (and `node_modules/` if needed), run `npm install`, then `npm run dev` again. |
| Changes in `next.config.ts` or `.env` not picked up  | Restart `npm run dev`.                                                                |
| PowerShell: *running scripts is disabled*           | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use the VS Code terminal with Command Prompt. |

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

In-class examples and exercises are organized by session (e.g. `class_01_intro/`). Each class folder can contain:

- **`gatherly/`** — the course application as it stands at the end of that class. Fell behind? Start the next class from here.
- **`examples/`** — small standalone apps that show one concept in isolation.
- **`README.md`** — what the class covers, where to find each concept in the code, exercises and links.

| Class | Topic |
| ----- | ----- |
| [01 — Introduction](./class_01_intro) | App Router, routing, layouts, Server vs Client Components, rendering, Tailwind |

To run any of them:

```bash
cd class_01_intro/gatherly
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
