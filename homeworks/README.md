# 📂 Homeworks

Each homework has its own file here, added after the class it belongs to (`hmw_1.md`, `hmw_2.md`, …).

| Homework                            | Topic                                              | After class |
| ----------------------------------- | -------------------------------------------------- | ----------- |
| [Homework 1](./hmw_1.md)            | 🎲 A Wordle-style word game (a standalone project)  | 4           |

## How to submit

1. Create **your own GitHub repository** for the homework and work there. Unless a homework says otherwise, it's a **separate project**, not part of the course repository or the Gatherly app.
2. Before you push, make sure these pass with no errors:

   ```bash
   npm run lint
   npm run build
   ```

   (`npm run build` also type-checks the project. If your project has an `npm run check` script like Gatherly's, run that instead.)
3. Email the link to your repository (and later, your deployed URL) to **[ivo@kostovski.dev](mailto:ivo@kostovski.dev)**, and say in the message that the homework is **done**. If the repository is private, invite me as a collaborator (*Settings → Collaborators → Add people*) using the email **ivo.kostovski@gmail.com**.

## Rules

- **Never commit `.env`.** It contains secrets. Commit `.env.example` instead, with the same keys and placeholder values.
- **AI assistants are welcome** — but you must be able to explain every line you hand in.
- Stuck? Ask early — in class or by email. A homework you got help with beats one you didn't hand in.
