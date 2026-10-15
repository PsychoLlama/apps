# Dynamic Pre-rendered Shells

How to serve a dynamic route — `<route>/:<param>` — from a single static shell
on Cloudflare's asset host. Applies to any route whose param is client-only
(e.g. a live handle that exists only after hydration) but whose first paint is
param-independent.

Example: `@app/beam` serves `/share/:id` from `/_dynamic/share/[id].html`.

## The problem

- CF static assets match literal paths only. There's no `[param]` filename
  routing: a `share/[id].html` asset is served at `/share/[id]` and nowhere
  else.
- The param exists only client-side, so no per-value page can be prerendered.
- Cold-loading `<route>/<value>` with no matching asset falls through to the
  404 shell; the client then hydrates the real route against 404 markup →
  hydration error.

## The shape

One prerendered shell, served for every value via a **200 rewrite** (not a
redirect — keeps the value in the URL for the client router).

Three coupled pieces, all in the deployed app's `vite.config.ts`:

1. **Prerender the shell** — nitro `prerender.routes`: add a manual entry
   `<route>/[<param>]`. `[<param>]` is a sentinel value; the link crawler can't
   reach this route on its own.
2. **Move the emitted HTML** — `hooks['prerender:generate']`: rename
   `<route>/[<param>]` → `/_dynamic<route>/[<param>].html`.
3. **Rewrite** — substrate's `redirects.rules`:
   `['<route>/:<param>', encodeURI('/_dynamic<route>/[<param>]'), 200]`.
   The source keeps Cloudflare's `:<param>` placeholder syntax.

## The circular-redirect pitfall

CF normalizes a rewrite **target** by stripping trailing `/index` and `.html`
_before_ its loop check. Three consequences:

- **Target must be extensionless** (`/_dynamic<route>/[<param>]`, not
  `.html`). Name the `.html` and CF strips it, 307s to the bare path → the
  value drops out of the URL.
- **Target must be percent-encoded.** A raw `[<param>]` target gets the same
  307, to its encoded form.
- **Target must not match the source pattern.** A shell left at
  `<route>/[<param>]` matches `<route>/:<param>` → CF rejects the whole rule as
  an infinite loop. The `/_dynamic` prefix is what step 2 buys: source patterns
  are anchored at the root, so no app route can match it.
