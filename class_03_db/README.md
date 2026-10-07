# Class 03 — The Database: PostgreSQL & Drizzle ORM

Until now Gatherly showed **mock data** that lived in a TypeScript file. This class adds a real **PostgreSQL database**: we install a server, describe the tables in TypeScript with **Drizzle ORM**, and create them with **migrations**.

> **Where we end up:** the database, its tables and the connection exist. The pages (`/` and `/events`) still read the mock data from `mocks/mock-events.ts`. The next step is to fill the tables with that data (a seed script) and replace the mock import with a Drizzle query. Because the mocks have the same shape as database rows, the components won't need to change.

## 📁 What's in this folder

| Folder                    | What it is                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`gatherly/`](./gatherly) | The course app at the end of class 3: the shadcn/ui components from class 2, plus `db/`, `drizzle/`, `drizzle.config.ts` and `.env.example`. Every file has comments written for students. See its [README](./gatherly/README.md) for the project structure and scripts |

**On this page:** [Big picture](#-the-big-picture) · [Step 1: PostgreSQL server](#-step-1--get-a-postgresql-server-choose-one-option) · [Step 2: connect the project](#-step-2--connect-the-project) · [Step 3: create the tables](#-step-3--create-the-tables) · [Drizzle explained](#-drizzle-in-this-project) · [Cheat sheet](#-psql-and-sql-cheat-sheet) · [Troubleshooting](#-troubleshooting) · [Exercises](#-try-it-yourself) · [Links](#-useful-links)

---

## 🧠 The big picture

```
 Your code            Drizzle ORM          pg driver          PostgreSQL server
 ─────────────        ─────────────        ─────────────      ─────────────────────────
 db.select()    ──►   builds the SQL  ──►  sends it over ──►  runs it on the database
 .from(events)        types the result     a connection       "gatherly"  (port 5432)
                                           (a Pool)           └─ tables: events, venues, …
```

| Word                   | What it means                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| **PostgreSQL**         | The database **server**: a program that runs on your computer, stores data on disk and answers SQL queries      |
| **Database**           | One named collection of tables **inside** the server. Ours is called `gatherly`. One server can host many       |
| **Table / row**        | A table is like a spreadsheet tab (`events`); a row is one record (one event)                                   |
| **SQL**                | The language used to talk to the database: `SELECT * FROM events;`                                              |
| **ORM** (Drizzle)      | A library that lets us write TypeScript instead of raw SQL strings and gives us **types** for the results       |
| **Driver** (`pg`)      | The low-level library that opens the network connection to PostgreSQL. Drizzle sits on top of it                |
| **Migration**          | A SQL file that changes the database structure (create a table, add a column). Applied **in order**, once       |
| **Connection string**  | One line with everything needed to connect: `postgres://USER:PASSWORD@HOST:PORT/DATABASE`                       |

You need **two** things on your machine: a **running PostgreSQL server** (Step 1) and a **database named `gatherly`** inside it (Step 1 creates it too).

---

## 🐘 Step 1 — get a PostgreSQL server (choose ONE option)

| | **Option A: install on your computer** | **Option B: Docker** |
| --- | --- | --- |
| How it works | A normal installer. PostgreSQL runs as a background service | PostgreSQL runs inside a container: a sealed box that is easy to delete |
| Best if | You don't want to learn Docker | You like clean setups, or already use Docker |
| Install size | ~300 MB | Docker Desktop (~1 GB) + the image (~400 MB) |
| Windows / Mac | Different steps for each (below) | **Same commands** on both |
| Start / stop | Starts automatically with the computer | `docker start` / `docker stop` (or the Docker Desktop buttons) |
| Remove it | Uninstall the program | `docker rm` and you're done |

Both give the same result: a server on **port 5432** with a database called **`gatherly`**. Pick one. Don't run both at the same time, because they would fight for port 5432.

> ℹ️ **Version:** this project works with PostgreSQL **14 or newer**. We use **17** in the instructions below.

---

### Option A — install PostgreSQL on your computer

#### 🍎 macOS

**1. Install Homebrew** (skip if `brew --version` already works): follow the one-line command on [brew.sh](https://brew.sh/).

**2. Install and start PostgreSQL:**

```bash
brew install postgresql@17
brew services start postgresql@17
```

`brew services start` runs it in the background and starts it again after every reboot. Check with `brew services list`: `postgresql@17` should say **started**.

**3. Add the PostgreSQL tools (`psql`, `createdb`) to your PATH.** Homebrew installs this version "keg-only", so the commands aren't found until you do this. Apple Silicon (M1/M2/M3/M4) Macs:

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

On an **Intel** Mac use `/usr/local/opt/postgresql@17/bin` instead. Check it worked:

```bash
psql --version
```

**4. Create the database:**

```bash
createdb gatherly
```

**5. Test it:**

```bash
psql gatherly -c "SELECT version();"
```

You should see one row with the PostgreSQL version.

**6. Your connection string.** With Homebrew, the database user is your **macOS username** and there is **no password** (and there's no `postgres` user). Find your username:

```bash
whoami
```

Your `DATABASE_URL` is then:

```
postgres://YOUR_MAC_USERNAME@localhost:5432/gatherly
```

> 💡 **Prefer a point-and-click app?** [Postgres.app](https://postgresapp.com/) is an alternative: download it, drag it to Applications, open it and click **Initialize**. It also uses your macOS username with no password. Create the `gatherly` database with the **+** button or `createdb gatherly`.

#### 🪟 Windows

**1. Download the installer** from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/) → *Download the installer* (made by EDB) → pick version **17** for **Windows x86-64**.

**2. Run it.** Click *Next* through the wizard, but pay attention to these screens:

| Screen                | What to choose                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| Select Components     | Keep **PostgreSQL Server**, **pgAdmin 4** and **Command Line Tools**. You can untick **Stack Builder**   |
| Data Directory        | Keep the default                                                                                         |
| **Password**          | Choose a password for the database superuser **`postgres`**. ✍️ **Write it down**, because you can't read it back later. For local development something simple is fine (e.g. `postgres`) |
| Port                  | Keep **5432**                                                                                            |
| Locale                | Keep the default                                                                                         |

When it finishes, PostgreSQL is already running as a Windows service and starts with your computer.

**3. Create the database.** Pick whichever you like:

*With pgAdmin (point and click):*

1. Open **pgAdmin 4** from the Start menu (it asks for a master password for pgAdmin itself, which is unrelated to the database password).
2. In the left tree open **Servers → PostgreSQL 17** and enter the `postgres` password from step 2.
3. Right-click **Databases → Create → Database…**
4. Name it **`gatherly`** → **Save**.

*With SQL Shell (psql):*

1. Open **SQL Shell (psql)** from the Start menu.
2. Press **Enter** four times to accept the defaults for *Server*, *Database*, *Port* and *Username*, then type your password (nothing shows while you type, which is normal).
3. Run:

```sql
CREATE DATABASE gatherly;
```

**4. Your connection string:**

```
postgres://postgres:YOUR_PASSWORD@localhost:5432/gatherly
```

> ⚠️ If your password contains special characters, replace them with their URL codes in the string: `@` → `%40`, `#` → `%23`, `/` → `%2F`, `:` → `%3A`, `?` → `%3F`, `%` → `%25`. A simple password avoids the problem.

**Optional — use `psql` from any terminal:** add `C:\Program Files\PostgreSQL\17\bin` to your `Path` (Start → *Edit the system environment variables* → *Environment Variables…* → select `Path` → *Edit* → *New*), then open a **new** terminal and run `psql --version`.

**Is it running?** Start → *Services* → look for `postgresql-x64-17` with status **Running**.

---

### Option B — PostgreSQL in Docker

The idea: Docker downloads a ready-made PostgreSQL **image** and runs it as a **container**. Nothing is installed on your system, and everything is one command.

**1. Install Docker Desktop**

- macOS: [docs.docker.com/desktop/setup/install/mac-install](https://docs.docker.com/desktop/setup/install/mac-install/)
- Windows: [docs.docker.com/desktop/setup/install/windows-install](https://docs.docker.com/desktop/setup/install/windows-install/). It needs **WSL 2** (the installer offers to set it up) and hardware virtualization enabled in the BIOS. Restart if it asks.

Open **Docker Desktop** and wait until it says the engine is **running**. Then check in a terminal:

```bash
docker --version
docker info
```

If `docker info` prints a long report (and no "cannot connect to the Docker daemon" error), you're ready.

**2. Create and start the PostgreSQL container.** Run this **one line** (works in macOS Terminal, Windows PowerShell and Command Prompt):

```bash
docker run --name gatherly-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gatherly -p 5432:5432 -v gatherly-pgdata:/var/lib/postgresql/data -d postgres:17
```

The first time, Docker downloads the image, which takes a minute. What each part means:

| Part                                          | Meaning                                                                                  |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `--name gatherly-db`                          | A name for the container, so we can start, stop and inspect it                           |
| `-e POSTGRES_USER=postgres`                   | The superuser name                                                                       |
| `-e POSTGRES_PASSWORD=postgres`               | Its password. Fine for **local** development only, never for a real server               |
| `-e POSTGRES_DB=gatherly`                     | **Creates the `gatherly` database for you** on first start. No manual step               |
| `-p 5432:5432`                                | Maps *port on your computer* : *port inside the container*, so `localhost:5432` reaches PostgreSQL |
| `-v gatherly-pgdata:/var/lib/postgresql/data` | Stores the data in a Docker **volume**, so your tables survive when the container is removed |
| `-d`                                          | Run in the **d**etached mode (in the background)                                         |
| `postgres:17`                                 | The image: PostgreSQL version 17. We pin the version so the volume path above stays valid |

**3. Check that it works:**

```bash
docker ps
```

You should see `gatherly-db` with status **Up**. To see the server's log:

```bash
docker logs gatherly-db
```

The last lines should say `database system is ready to accept connections`.

**4. Your connection string** is already what's in `.env.example`, so there's nothing to change:

```
postgres://postgres:postgres@localhost:5432/gatherly
```

**Everyday Docker commands**

| What you want                          | Command                                                                |
| -------------------------------------- | ---------------------------------------------------------------------- |
| Start it again (after a reboot)        | `docker start gatherly-db`                                             |
| Stop it                                | `docker stop gatherly-db`                                              |
| See if it's running                    | `docker ps` (running) or `docker ps -a` (all)                          |
| Open a SQL prompt inside it            | `docker exec -it gatherly-db psql -U postgres -d gatherly`             |
| Read the log                           | `docker logs gatherly-db`                                              |
| **Wipe everything and start fresh**    | `docker rm -f gatherly-db` then `docker volume rm gatherly-pgdata`, then run the `docker run` line again |

> ⚠️ `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB` are only read **the first time**, when the volume is empty. If you change them later and nothing happens, use the "wipe and start fresh" command.

> ⚠️ **"port is already allocated" / "address already in use"?** Something else is already using 5432, such as a PostgreSQL you installed earlier (Option A). Stop that one, **or** map another port: use `-p 5433:5432` in the `docker run` line and change `5432` to `5433` in your `DATABASE_URL`.

---

## 🔌 Step 2 — connect the project

**1. Create your `.env` file** from the template (run in the project folder, **`class_03_db/gatherly`**):

```bash
cp .env.example .env
```

On Windows PowerShell: `Copy-Item .env.example .env` (Command Prompt: `copy .env.example .env`).

**2. Open `.env`** and make sure `DATABASE_URL` matches **your** setup from Step 1:

| Your setup                  | `DATABASE_URL`                                                  |
| --------------------------- | --------------------------------------------------------------- |
| Docker (Option B)           | `postgres://postgres:postgres@localhost:5432/gatherly` (the default, no change) |
| Windows installer (Option A) | `postgres://postgres:YOUR_PASSWORD@localhost:5432/gatherly`    |
| macOS Homebrew (Option A)   | `postgres://YOUR_MAC_USERNAME@localhost:5432/gatherly`          |

The parts of the string:

```
postgres://  postgres  :  YOUR_PASSWORD  @  localhost  :  5432  /  gatherly
 protocol     user        password         host         port      database name
```

> 🔒 **`.env` is never committed.** It's listed in `.gitignore`, because it holds a password. The template `.env.example` **is** committed, so everyone knows which variables are needed. Both Next.js and our Drizzle config read `.env`, so the URL lives in only one place.

**3. Test the connection** from the terminal, before involving the project (this isolates problems):

```bash
psql "postgres://postgres:postgres@localhost:5432/gatherly" -c "SELECT 1;"
```

Use *your* URL. It should print a table with a `1`. (With Docker and no `psql` installed on your computer: `docker exec -it gatherly-db psql -U postgres -d gatherly -c "SELECT 1;"`.) If it fails, see [Troubleshooting](#-troubleshooting).

---

## 🏗 Step 3 — create the tables

The tables are described in `db/schema.ts`, and Drizzle already turned them into SQL files in `drizzle/`. You only need to **apply** them:

```bash
cd class_03_db/gatherly
npm install
npm run db:migrate
```

`npm run db:migrate` reads the files in `drizzle/` **in order** (`0000_…`, `0001_…`, `0002_…`), runs the ones the database hasn't seen yet and remembers which ones it ran (in a table called `drizzle.__drizzle_migrations`). Running it again is safe: it does nothing when everything is already applied.

**Look at the result**, with any of these:

| Tool                  | How                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Drizzle Studio**    | `npm run db:studio`, then open **[local.drizzle.studio](https://local.drizzle.studio)**. A browser UI for browsing and editing rows. (Safari and Brave can block it, so try Chrome or Firefox.) Stop it with `Ctrl+C` |
| **psql**              | `psql "<your DATABASE_URL>"` then `\dt` (list tables)                                                       |
| **pgAdmin** (Windows installer) | Servers → PostgreSQL 17 → Databases → gatherly → Schemas → public → Tables                        |

You should see five tables: **`users`**, **`venues`**, **`categories`**, **`events`** and **`event_categories`**. They're empty for now.

```
users ──< events >── venues              users: the organizer of each event
              │                           venues: where it happens
              └──< event_categories >── categories     (many-to-many link table)
```

---

## 🧩 Drizzle in this project

### The files

| File                    | What it is                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `db/schema.ts`          | **The tables, in TypeScript.** The source of truth. Read the comments in it                                  |
| `db/index.ts`           | Creates the **`db` client** (a connection Pool + Drizzle). The rest of the app imports `db` from here. Marked `server-only` so it can never end up in browser code |
| `drizzle.config.ts`     | Settings for the `drizzle-kit` command line tool: which schema file, where to write migrations, which database |
| `drizzle/*.sql`         | **Generated** migrations (SQL). Commit them. **Never edit or delete** a migration that was already applied   |
| `drizzle/meta/`         | **Generated** bookkeeping (a journal + snapshots of the schema) that lets `generate` know what changed. Don't touch |
| `.env` / `.env.example` | The `DATABASE_URL`                                                                                          |

### The npm scripts

| Command               | What it does                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run db:generate` | Compares `db/schema.ts` with the last snapshot and **writes a new SQL migration** into `drizzle/`. Doesn't touch the database |
| `npm run db:migrate`  | **Runs** the migrations that haven't been applied yet against the database in `DATABASE_URL`        |
| `npm run db:studio`   | Opens Drizzle Studio, a browser UI for your data                                                    |
| `npm run db:seed`     | An empty placeholder for now. It becomes the script that fills the tables with the sample events    |
| `npm run typecheck`   | Generates Next.js route types, then runs the TypeScript compiler                                    |

### How to change the database (the workflow)

```
1. Edit db/schema.ts            e.g. add  website: text()  to `venues`
2. npm run db:generate          Drizzle writes drizzle/0003_something.sql
3. Open and READ the new .sql   Does it do what you meant? Anything that deletes data?
4. npm run db:migrate           Applies it to your database
5. Commit schema + drizzle/     Teammates run `npm run db:migrate` to catch up
```

**Rules of thumb**

- A migration is like a git commit for the database: **append new ones, never rewrite old ones.** Made a mistake? Change the schema again and generate another migration.
- `generate` *makes* the SQL, `migrate` *runs* it. Two separate steps on purpose, so you can review the SQL in between.
- You may see `drizzle-kit push` in tutorials. It changes the database directly without migration files. Quick for experiments, but it leaves no history, so **we don't use it** in this project.
- Migration names like `0000_mushy_ronan.sql` are random. The number is what matters.

### Using the database in code (preview)

```ts
import { db } from '@/db';
import { events } from '@/db/schema';
import { eq } from 'drizzle-orm';

// SELECT * FROM events WHERE status = 'published'
const published = await db.select().from(events).where(eq(events.status, 'published'));

// events together with their venue and organizer, in one go (uses the relations in schema.ts)
const withVenue = await db.query.events.findMany({ with: { venue: true, organizer: true } });
```

`logger: true` in `db/index.ts` prints each SQL statement in the terminal running `npm run dev`. Watch it to see what Drizzle actually sends. We'll wire this into the pages next.

### Reference — how Drizzle was added to the project from scratch

You don't need to do this (it's already done), but this is how you'd set up Drizzle in a **new** Next.js project:

```bash
npm install drizzle-orm@^0.45 pg
npm install -D drizzle-kit@^0.31 tsx @types/pg @next/env
```

| Package           | Why                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `drizzle-orm`     | The ORM itself (runtime)                                                                         |
| `pg`              | The PostgreSQL driver (`node-postgres`)                                                          |
| `drizzle-kit`     | The CLI: `generate`, `migrate`, `studio`                                                         |
| `@next/env`       | Lets `drizzle.config.ts` read `.env` the same way Next.js does                                   |
| `tsx`             | Runs TypeScript files directly. We'll use it for the seed script                                 |
| `@types/pg`       | TypeScript types for `pg`                                                                        |

> ⚠️ **Version warning.** The current Drizzle docs may tell you to install `drizzle-orm@rc` / `drizzle-kit@rc` (the **1.0 release candidate**). Some syntax differs from the stable 0.45 line, so **we pin `0.45` / `0.31` on purpose**. When a tutorial or an AI assistant gives you Drizzle code that doesn't match ours, check the version first.

Then create, in this order: `.env` (with `DATABASE_URL`) → `db/schema.ts` → `drizzle.config.ts` → `db/index.ts`, and add the scripts to `package.json`:

```json
"scripts": {
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:studio": "drizzle-kit studio"
}
```

Finally run `npm run db:generate` (creates the first migration) and `npm run db:migrate` (applies it).

---

## 🧾 psql and SQL cheat sheet

Open a prompt: `psql "<your DATABASE_URL>"` (or `docker exec -it gatherly-db psql -U postgres -d gatherly`).

| Command                                   | What it does                                  |
| ----------------------------------------- | --------------------------------------------- |
| `\l`                                      | List databases                                |
| `\c gatherly`                             | Connect to the `gatherly` database            |
| `\dt`                                     | List tables                                   |
| `\d events`                               | Describe the `events` table (columns, keys)   |
| `SELECT * FROM events;`                   | All rows of a table (SQL ends with `;`)       |
| `SELECT title, city FROM events LIMIT 5;` | Chosen columns, first 5 rows                  |
| `SELECT count(*) FROM events;`            | How many rows                                 |
| `\q`                                      | Quit                                          |

---

## 🛟 Troubleshooting

| Error / symptom                                                        | Likely cause → fix                                                                                   |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `ECONNREFUSED 127.0.0.1:5432` / `connection refused`                   | The server isn't running. Mac: `brew services start postgresql@17`. Windows: Services → `postgresql-x64-17` → Start. Docker: open Docker Desktop, then `docker start gatherly-db` |
| `password authentication failed for user "postgres"`                   | Wrong password in `.env`. Docker: the password is `postgres` (and only changes by wiping the volume). Windows: the one you chose in the installer |
| `database "gatherly" does not exist`                                   | The database wasn't created. Mac: `createdb gatherly`. Windows: pgAdmin or `CREATE DATABASE gatherly;`. Docker: the volume already existed without it, so wipe and start fresh |
| `role "postgres" does not exist` (macOS)                               | Homebrew has no `postgres` user. Use your macOS username: `postgres://YOUR_USERNAME@localhost:5432/gatherly` |
| `DATABASE_URL is not set. Copy from .env.example to .env…`             | You haven't created `.env` (Step 2), or you created it while `npm run dev` was running. **Restart** the dev server |
| `relation "events" does not exist`                                     | The tables haven't been created yet. Run `npm run db:migrate`                                        |
| `psql: command not found` / "not recognized as a command"             | `psql` isn't on your PATH. Mac: Step 3 of the macOS instructions. Windows: add `C:\Program Files\PostgreSQL\17\bin` to `Path`, then open a **new** terminal. Or use pgAdmin / `docker exec` |
| `Cannot connect to the Docker daemon` / `docker info` fails            | Docker Desktop isn't running. Open it and wait for the engine to start                               |
| Docker: `port is already allocated`                                    | Another PostgreSQL uses 5432. Stop it, or use `-p 5433:5432` and port `5433` in the URL              |
| `Error: connect ... ` after a long wait                                | Wrong host or port in `DATABASE_URL`, or a firewall. Double-check the URL against the table in Step 2 |
| Special characters in the password break the URL                       | Percent-encode them (`@` → `%40`, `#` → `%23`, …) or choose a simpler local password                |
| Docker on Windows won't start                                          | Enable virtualization in the BIOS and install WSL 2: run `wsl --install` in an admin PowerShell, then restart |

---

## 🏋️ Try it yourself

1. Connect with `psql` (or pgAdmin) and run `\dt`, then `\d events`. Match each column to `db/schema.ts`: which TypeScript name became which SQL name?
2. Run `npm run db:studio`, add a row to `categories` by hand, then find it again with `SELECT * FROM categories;` in `psql`.
3. Add a nullable `website: text()` column to `venues` in `db/schema.ts`. Run `npm run db:generate`, **read** the new SQL file, then `npm run db:migrate`. Check the new column in Studio.
4. Stop the server (`docker stop gatherly-db`, or stop the service) and reload `npm run dev`. What happens, and where do you see the error? Start it again.
5. Explain in your own words: what's the difference between `db:generate` and `db:migrate`, and why are there two steps?
6. Look at `events` in `db/schema.ts`: which columns are **foreign keys**, and what would happen if you tried to delete a venue that has events? (Hint: look at `.references(...)`, and compare with `event_categories`.)

---

## 🔗 Useful links

**PostgreSQL**

- [Download PostgreSQL](https://www.postgresql.org/download/) · [macOS](https://www.postgresql.org/download/macosx/) · [Windows](https://www.postgresql.org/download/windows/)
- [Homebrew](https://brew.sh/) · [Postgres.app](https://postgresapp.com/) · [pgAdmin](https://www.pgadmin.org/)
- [PostgreSQL tutorial (official)](https://www.postgresql.org/docs/current/tutorial.html) and [psql reference](https://www.postgresql.org/docs/current/app-psql.html)
- Learn SQL by doing: [SQLBolt](https://sqlbolt.com/) · [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

**Docker**

- [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) · [for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker: Get started](https://docs.docker.com/get-started/)
- [The official `postgres` image](https://hub.docker.com/_/postgres) — all the environment variables it supports

**Drizzle ORM**

- [Drizzle + PostgreSQL: get started](https://orm.drizzle.team/docs/get-started/postgresql-new)
- [Column types for PostgreSQL](https://orm.drizzle.team/docs/column-types/pg) · [Schema declaration](https://orm.drizzle.team/docs/sql-schema-declaration)
- [Migrations](https://orm.drizzle.team/docs/migrations) · [`drizzle-kit generate`](https://orm.drizzle.team/docs/drizzle-kit-generate) · [`migrate`](https://orm.drizzle.team/docs/drizzle-kit-migrate) · [`studio`](https://orm.drizzle.team/docs/drizzle-kit-studio)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
- [Select queries](https://orm.drizzle.team/docs/select) and [relational queries](https://orm.drizzle.team/docs/rqb)
- [node-postgres (`pg`) docs](https://node-postgres.com/)

**Next.js**

- [Environment variables](https://nextjs.org/docs/app/guides/environment-variables) — how `.env` files are loaded
- [Data fetching in Server Components](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Data security (`server-only`)](https://nextjs.org/docs/app/guides/data-security)
- [Class 02 README](../class_02_essentials/README.md) — shadcn/ui installation and more
