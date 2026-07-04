# Dynamic Pre-rendered Shells

How to serve a dynamic route — `/<app>/subroute/:<param>` — from a single static
shell on Cloudflare's asset host. Applies to any route whose param is
client-only (e.g. a live handle that exists only after hydration) but whose
first paint is param-independent.

## The problem

- CF static assets match literal paths only — no `[param]` filename routing.
- The param exists only client-side, so no per-value page can be prerendered.
- Cold-loading `/<app>/subroute/<value>` with no matching asset falls through to
  the 404 shell; the client then hydrates the real route against 404 markup →
  hydration error.

## The shape

One prerendered shell, served for every value via a **200 rewrite** (not a
redirect — keeps the value in the URL for the client router).

Three coupled pieces, all in `packages/app/main`:

1. **Prerender the shell** — `vite.config.ts`, nitro `prerender.routes`: add a
   manual entry `/<app>/subroute/__<param>`. `__<param>` is a sentinel value; the
   link crawler can't reach this route on its own.
2. **Flatten the emitted HTML** — same file, `hooks['prerender:generate']`:
   rename `/<app>/subroute/__<param>` → `/<app>/__<param>.html` (up one level, out
   of `/<app>/subroute/`).
3. **Rewrite** — `public/_redirects`:
   `/<app>/subroute/:<param>  /<app>/__<param>  200`.

## The circular-redirect pitfall

CF normalizes a rewrite **target** by stripping trailing `/index` and `.html`
_before_ its loop check. Two consequences:

- **Target must be extensionless** (`/<app>/__<param>`, not `.html`). Name the
  `.html` and CF strips it, 307s to the bare path → the value drops out of the
  URL.
- **Target must not live under the source prefix.** A shell left at
  `/<app>/subroute/__<param>` renormalizes back into the `/<app>/subroute/*` source →
  CF rejects the whole rule as an infinite loop. Flattening to `/<app>/`
  (a shallower prefix the source can't match) is what step 2 buys.

## Recipe

All three, keeping the target one level above its rewrite source:

- nitro `prerender.routes`: add `/<app>/subroute/__<param>`
- `prerender:generate` hook: rename it to `/<app>/__<param>.html`
- `_redirects`: `/<app>/subroute/:<param>  /<app>/__<param>  200`
