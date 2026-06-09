## Stack

- pnpm workspaces
- turbo (task runner)
- SolidStart
- Vanilla Extract
- Storybook
- Unplugin Icons
- Wrangler/CF Workers

## Layout

- Packages live at `packages/{app,lib,dev}/<name>` and publish as `@<tier>/<name>`.
  - `@app/*` — shipped apps.
  - `@lib/*` — shared libraries.
  - `@dev/*` — internal tooling.
- Enumerate packages and their purpose: `jq -r '[.name, .description] | @tsv' packages/*/*/package.json`.
- `@app/*` packages export top-level components. `@app/main` owns routing — its `src/routes/**/*.tsx` files import from `@app/*` packages and export the component as the route's default.
- Rust crates live flat at `crates/<name>` — Cargo's namespace is global, so no tier dirs.
- A crate that crosses into JS (wasm/napi bridge) carries a `package.json` and publishes as `@crate/<name>`; it's both a Cargo member and a pnpm workspace package. `@crate/*` is a bridge, not a tier — don't mirror the `packages/*` taxonomy.
- A pure-Rust crate (CLI, native bin, build helper) is a Cargo member only: no `package.json`, no npm name, absent from the pnpm workspace.

## Dev

- `pnpm check` to validate. Must pass before committing.
- Tasks are defined in `turbo.json` and dispatch to package.json scripts at the root and under `packages/**`.
- All routes are file-based: `packages/app/main/src/routes/**/*.tsx`.

## Dependencies

- Cross-package refs use `"workspace:*"`.
- Versions for deps used by more than one package live in the `catalog:` block of `pnpm-workspace.yaml`. Reference them as `"catalog:"`.
- Runtime singletons (`solid-js`, `@solidjs/router`) go as `"peerDependencies"` with a `"*"` range in `@lib/*` and `@app/*` packages — the host supplies the actual version via `catalog:`.

## UI Components

- For reference docs, load the `ui-reference` skill.
- Import from `@lib/ui`.
- Prefer semantic elements via the `as` prop (`p`, `main`, `footer`, etc). Avoid `div`.
- Design mobile-first. Use `breakpoint` tokens in `@media` blocks for responsive overrides.
- Avoid needless wrapper elements.

## Design System

- For reference docs, load the `design-reference` skill.
- Import tokens from `@lib/design`. NEVER hard-code colors, spacing, radius, shadows, motion, or typography values.
- Avoid needless CSS reset rules. We use `the-new-css-reset`. It is thorough.

## State Management

- For reference docs, load the `state-reference` skill.
- Import from `@lib/state`.

## Icons

- Import SVG icon components from `virtual:icons/mdi/*`.
- Prefer material design icons.

## Testing

- Co-locate tests. Example: `foo.ts` and `__tests__/foo.test.ts`.

## Doc Comments

- Default to JSDoc (`/** … */`) on modules, exported types, and exported fields. Consumers read it as intrinsic documentation — it belongs to the API.
- Drop to plain `//` comments when the note is an internal aside (implementation context, a nearby warning) that shouldn't leak into tooling surfaces like hover popups or generated docs.
- Lean brief. A good doc comment answers "what is this and when would I reach for it?" — not "how does it work line by line."
