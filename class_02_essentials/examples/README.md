# Class 02 — Examples

Playground routes for class 2. Every file under `app/` has comments explaining **what** happens and **why**, so read them alongside the running app.

```bash
npm install
npm run dev
```

| URL                                                                     | Shows                                                                      |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [/where-does-this-run](http://localhost:3000/where-does-this-run)       | Server vs Client Component — compare the terminal and the browser console  |
| [/streaming](http://localhost:3000/streaming)                           | `<Suspense>` streams a slow component in after 5 s                         |
| [/error-examples](http://localhost:3000/error-examples)                 | Click the button: `error.tsx` catches a render error                       |
| [/error-examples/missing](http://localhost:3000/error-examples/missing) | `notFound()` → `error-examples/not-found.tsx`                              |
| [/error-examples/123](http://localhost:3000/error-examples/123)         | `notFound()` in a dynamic route → `[id]/not-found.tsx`                     |
| [/error-examples/42](http://localhost:3000/error-examples/42)           | The same dynamic route when the item exists                                |

> In development, the Next.js error overlay appears on top of `error.tsx`. Close it to see your own error UI, or try a production build (`npm run build && npm run start`). There, Server Component error messages are also hidden from the browser.

See the [class README](../README.md) for the full explanation, exercises and links.
