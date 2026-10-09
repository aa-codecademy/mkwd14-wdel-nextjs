# 🎲 Homework 1 — Game Night: build a word game

> Every good event starts with an icebreaker. Gatherly needs a **Game Night** page: a **Wordle-style word game**, built into your own Gatherly app.

**Estimated time:** 4–6 hours · **Deadline:** _to be announced in class_ · **Uses:** everything from classes 1–4

This homework describes **what** the game must do. **How** you build it is up to you: the data model, file structure, components, naming and libraries are your decisions. There's no single right answer, and making those decisions is the point. Look back at the class READMEs and the code from the classes for ideas.

---

## 🎮 The game

If you've never played [Wordle](https://www.nytimes.com/games/wordle/index.html), try it for two minutes first.

1. There is a secret **5-letter word**.
2. The player has **6 tries** to guess it. Every guess must be a 5-letter word.
3. After each guess, every letter gets a colour:

| Colour        | Meaning                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| 🟩 **Green**  | The letter is in the word **and in the right place**                             |
| 🟨 **Yellow** | The letter is in the word, but in a **different place**                          |
| ⬜ **Grey**   | The letter is **not in the word** (or it appears fewer times than the player used it) |

4. Guess it in 6 tries or fewer and you win. Otherwise you lose, and the answer is revealed.

In **our** version there's no "word of the day". There is a **collection of numbered puzzles** (Puzzle #1, #2, …) and players can play any of them.

---

## 📋 Business requirements

### 1. Puzzles

- There are **at least 30 puzzles**. Each has a **number** (1, 2, 3, …) and a secret **5-letter word**.
- Puzzles are **stored in the database**, so they survive a restart and can be changed without editing page code.
- Loading the puzzles into a fresh database is **one repeatable command**. Running it **twice** must not fail or create duplicate puzzles.
- Words are lowercase, family-friendly and real. (Need ideas? Pick your own, or use these: `apple brave crane drift eagle flame grape house input jelly knife lemon magic night ocean piano queen river stone tiger uncle video water young zebra bread chair dream earth field`.)

### 2. Finding a puzzle

- The site has a **Game** page that explains the rules briefly and **lists all puzzles** ("Puzzle #7", …). Each puzzle in the list opens that puzzle.
- The list must **not reveal the secret words**.
- The Game page can be reached from the **site header** on every page.

### 3. Playing a puzzle

- Every puzzle has its **own address**, so it can be bookmarked and shared (for example `/game/7`).
- If someone opens the address of a puzzle that doesn't exist, or the number makes no sense (`/game/abc`, `/game/0`, `/game/-3`, `/game/9999`), they see a **friendly "not found" page** with a way back to the puzzle list. The site must not crash or show a blank page.
- The player sees a board with **6 attempts × 5 letters**, showing past guesses, the current one and the empty attempts.
- The player can type a guess and submit it.
- A guess that is **not valid** (fewer or more than 5 letters, digits or symbols, empty) shows a **clear message** and **does not use up an attempt**. Capital letters are fine: `CRANE` and `crane` are the same guess.
- After each valid guess its letters are coloured following the rules above. **Repeated letters must be handled correctly** (see the test cases below).
- The game **ends** when the player guesses the word or uses all 6 attempts. After that, the player **can't guess any more**.
- On a **win**, the player sees a congratulation. On a **loss**, the player sees the **correct word**.
- When the game is over, there's a **link to the next puzzle** (and the game stays friendly if there is no next one).

### 4. Look and feel

- It looks like part of Gatherly: same header, footer and general style.
- It's comfortable to use on a **phone-sized screen**.
- The result of each letter must **not depend on colour alone**. Someone who can't tell green from yellow should still be able to read the result. (How you do that is up to you.)
- At least one component from the **shadcn/ui** library is used.

### 5. Quality

- `npm run check` **passes** (type check, lint and formatting). The class 4 code has a few known problems, so fix them first. You'll find them listed in the [class 04 README](../class_04_routing/README.md).
- No leftover debug output (`console.log`), and no unused code.
- **No secrets are committed.** `.env` is not in the repository, and `.env.example` is.
- Someone with a fresh database can follow your README instructions and get the game running. **Add a short "How to run the game" section** to your project's README.
- Your **git history** tells a story: small commits with meaningful messages (at least 5), not one giant "done".
- You can **explain every line** you hand in, including parts an AI assistant helped with.

---

## ✅ Test cases for the colours

Your letter-colouring must produce exactly these results. They cover the tricky part, repeated letters. Work a few out on paper before you code them. 🙂

| Answer  | Guess   | Expected result                                          |
| ------- | ------- | -------------------------------------------------------- |
| `crane` | `crane` | correct, correct, correct, correct, correct              |
| `alloy` | `llama` | present, correct, present, absent, absent                |
| `speed` | `erase` | present, absent, absent, present, present                |
| `apple` | `eagle` | absent, present, absent, correct, correct                |

(*correct* = green, *present* = yellow, *absent* = grey.) For example, `apple` has only one `e`, and the `e` at the end of `eagle` already matches it, so the `e` at the start is grey, not yellow.

Show how you checked them: a small table in your README, a script that prints the results, or anything else that convinces a reviewer.

---

## 🤔 Reflection (short answers)

Create a file `HOMEWORK_1.md` in the root of your repo and answer these in **2–4 sentences each**, in your own words:

1. Which parts of your game run **on the server** and which **in the browser**? How can you tell? Why did you split it that way?
2. Open your browser's developer tools on a puzzle page. **Can you find the answer** without playing? Where? Is that a problem in a real game, and what do you think the solution would look like?
3. Where and how did you store the puzzles, and why did you choose that? What would be different with a different choice?
4. What happens at `/game/abc`, `/game/0` and `/game/9999`, and which part of your code decides it?
5. What was the hardest part? What would you do differently if you started again?

---

## 📬 How to submit

1. Push your work to **your own GitHub repository** (see the [homework rules](./README.md)).
2. Send the **link to the repository** as instructed in class.
3. Make sure `HOMEWORK_1.md` (the reflection) and the "How to run the game" section are in the repo.

---

## 🚀 Stretch goals (optional, for fun)

Pick any, or invent your own:

- ⌨️ Play using the **physical keyboard** directly on the board.
- 🔤 An **on-screen keyboard** whose keys show what you've learned about each letter.
- 💾 The game **remembers progress** if you reload the page.
- 📋 A **Share** button that copies a spoiler-free result, like `Puzzle #7 4/6 🟩🟨⬜⬜🟩`.
- 🔥 A **hard mode**, where clues you've revealed must be used in later guesses.
- 🎨 **Animations** for the tiles, and a dark-mode-friendly look.
- 🧮 The Game page shows which puzzles you've **already solved**.
- 📖 Only **real words** are accepted as guesses.
- ➕ Anything else that makes Game Night better.

---

## 📚 Where to look when you're stuck

- Your own notes, and the READMEs of the classes: [class 02](../class_02_essentials/README.md) (Server vs Client Components, shadcn/ui), [class 03](../class_03_db/README.md) (the database, migrations), [class 04](../class_04_routing/README.md) (dynamic routes, search, queries, validation, seeding).
- The official docs: [Next.js](https://nextjs.org/docs), [React](https://react.dev/learn), [Drizzle](https://orm.drizzle.team/docs/overview), [Zod](https://zod.dev/), [Tailwind CSS](https://tailwindcss.com/docs), [shadcn/ui](https://ui.shadcn.com/docs).
- React's guide on [choosing the state structure](https://react.dev/learn/choosing-the-state-structure) has a good tip for this game: don't store what you can calculate.
- Stuck for a long time? **Ask early**, in class or by email, and say what you tried.

> 🤖 **About AI:** you're welcome to use it, as stated in the rules. A good use is asking it to *explain* an error or a concept. A bad use is pasting the whole task and handing in the answer. You'll be asked to explain your code, and the reflection questions are there to check that you can.
