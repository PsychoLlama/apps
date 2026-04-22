## Stack

- pnpm workspaces
- SolidStart
- Vanilla Extract
- Storybook
- Unplugin Icons
- Wrangler/CF Workers

## Layout

- `packages/lib/design` — design tokens (`@lib/design`)
- `packages/lib/ui` — component library (`@lib/ui`)
- `packages/lib/shell` — site chrome (`@lib/shell`)
- `packages/lib/state` — state primitives (`@lib/state`)
- `packages/dev/eslint-plugin` — custom lint rules (`@dev/eslint-plugin`)
- `packages/app/main` — SolidStart host (`@app/main`)
- `packages/app/studio` — recording studio app (`@app/studio`)

Each `@app/*` package exports top-level components. `@app/main` owns routing — its `src/routes/**/*.tsx` files import from `@app/*` packages and export the component as the route's default.

## Dev

- `moon check --all` to validate. Must pass before committing.
- Tasks are defined in `moon.yml` (root) and `packages/app/main/moon.yml`.
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
