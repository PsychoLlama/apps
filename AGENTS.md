## Stack

- pnpm workspaces
- moon (task runner)
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

## Dev

- `moon check --all` to validate. Must pass before committing.
- Tasks are defined in `moon.yml` (root) and per-package `moon.yml` files under `packages/**`.
- All routes are file-based: `packages/app/main/src/routes/**/*.tsx`.

## Dependencies

- Cross-package refs use `"workspace:*"`.
- Versions for deps used by more than one package live in the `catalog:` block of `pnpm-workspace.yaml`. Reference them as `"catalog:"`.
- Runtime singletons (`solid-js`, `@solidjs/router`) go as `"peerDependencies"` with a `"*"` range in `@lib/*` and `@app/*` packages — the host supplies the actual version via `catalog:`.

## UI Components

- Reference docs: ./packages/lib/ui/src/docs/reference/index.md
- Import from `@lib/ui`.
- Prefer semantic elements via the `as` prop (`p`, `main`, `footer`, etc). Avoid `div`.
- Design mobile-first. Use `breakpoint` tokens in `@media` blocks for responsive overrides.
- Avoid needless wrapper elements.

## Design System

- Reference docs: ./packages/lib/design/src/docs/usage.md
- Import tokens from `@lib/design`. NEVER hard-code colors, spacing, radius, shadows, motion, or typography values.
- Avoid needless CSS reset rules. We use `the-new-css-reset`. It is thorough.

## State Management

- Reference docs: ./packages/lib/state/src/docs/usage.md
- Import from `@lib/state`.
- Side effects belong in activities, not workflows or stores.

## Icons

- Import SVG icon components from `virtual:icons/mdi/*`.
- Prefer material design icons.

## Testing

- Co-locate tests. Example: `foo.ts` and `__tests__/foo.test.ts`.

## Stories

- Stories live in `@dev/storybook` (`packages/dev/storybook/src/stories/`),
  never co-located with their subjects. Co-located stories caused `@lib/design`
  to dev-depend on `@lib/ui`, which already runtime-depends on `@lib/design` —
  centralizing breaks that cycle.

## Doc Comments

- Default to JSDoc (`/** … */`) on modules, exported types, and exported fields. Consumers read it as intrinsic documentation — it belongs to the API.
- Drop to plain `//` comments when the note is an internal aside (implementation context, a nearby warning) that shouldn't leak into tooling surfaces like hover popups or generated docs.
- Lean brief. A good doc comment answers "what is this and when would I reach for it?" — not "how does it work line by line."
