/**
 * apiError — ONE shape for every error our API returns.
 *
 * A client of an API (a phone app, another website, a script) can't read an error message from a page. It
 * needs a predictable format, so every failure looks the same:
 *
 *   { "error": { "code": "not_found", "message": "No published event abc", "details": ... } }
 *
 *   code     a short, stable machine word the client can switch on ("invalid_query", "not_found")
 *   message  a sentence for a human (a developer reading the response)
 *   details  optional extra, e.g. the Zod field errors of a bad query
 *
 * The HTTP STATUS CODE is the other half of an error, and it matters just as much: 400 bad request,
 * 404 not found, 401/403 not allowed, 500 our fault. Clients (and browsers, caches, monitoring) read the
 * status BEFORE they read the body.
 *
 * ⚠️ Bug in this snapshot: `status` is put INSIDE the JSON body, so the real HTTP status stays 200 OK. A
 * client sees "success" with an error inside. Pass it as the 2nd argument instead:
 *   return Response.json({ error: { code, message, ...(details ? { details } : {}) } }, { status });
 */
// ⚠️ Leftover auto-import: `error` from Node's 'console' module isn't used anywhere (ESLint reports it).
// Delete this line.
import { error } from 'console';

// `details?: unknown` = anything (we use Zod's field errors). The spread `...(details ? { details } : {})`
// adds the `details` key ONLY when there is something to say, so the JSON has no `"details": null`.
export function apiError(status: number, code: string, message: string, details?: unknown) {
  // `Response.json(body, init)` is the standard way to answer with JSON: it sets the Content-Type header for
  // us. The HTTP status belongs in `init` (the 2nd argument), see the note at the top of this file.
  return Response.json({
    error: { code, message, ...(details ? { details } : {}) },
    status,
  });
}
