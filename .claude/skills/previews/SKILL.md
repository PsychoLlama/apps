---
description: Run and share app previews — vite dev servers, local static builds, and PR deployment previews. Load before starting or stopping a server, or when asked for a preview.
---

# Notes

- Local servers choose an open port. Read output to find the binding.
- Other agents/worktrees may run servers. Avoid disrupting them; only stop your own.
- Launches can be slow depending on cache.

## Context

- `APP_NAME`: `name` field from `packages/app/*/wrangler.jsonc`.
- `<pkg>`: package name, e.g. `@app/example`.

# Initiator Rules

A preview is user-initiated if the user asked for a preview, agent otherwise.

## User

- Default: dev server.
- Launch preview with `xdg-open` or `open` after server is ready.
- Leave running.

## Agent

- Default: static server.
- Stop server when finished.

# Localhost URLs

Always prefix `APP_NAME` in the localhost URL. Example: `example.localhost:3000`.

This keeps origin state and service workers isolated between apps in localdev.

# Preview Types

## Dev Server

- Vite dev server. Automatically reloads on change.
- NOTE: stale artifacts possible after aggressive refactors, especially CSS.

Steps:

1. Start with `turbo run dev --filter <pkg>`.
2. Poll server until it's ready.

## Static Server

- Serves a static production build.

Steps:

1. Start with `turbo run preview --filter <pkg>`.
2. Poll server until it's ready.
3. Use `turbo run build --filter <pkg>` to update.

## Deployment Preview

- PRs automatically deploy to preview URLs.
- Each app deploys to `https://pr-{NUMBER}-{APP_NAME}.gibson.workers.dev/`.

Steps:

1. In background, wait for CI.
2. Get the PR number and find `APP_NAME`.
