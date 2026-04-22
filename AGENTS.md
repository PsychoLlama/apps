## Stack

- pnpm workspaces
- SolidStart
- Vanilla Extract
- Storybook
- Unplugin Icons
- Wrangler/CF Workers

## Layout

- `packages/design` — design tokens (`@psychollama/design`)
- `packages/ui` — component library (`@psychollama/ui`)
- `packages/state` — state primitives (`@psychollama/state`)
- `packages/eslint-plugin` — custom lint rules (`@psychollama/eslint-plugin`)
- `apps/web` — SolidStart app

## Dev

- `just check` to validate. Must pass before committing.
- Routes are file-based: `apps/web/src/routes/**/*.tsx`.

## UI Components

- Reference docs: ./packages/ui/src/docs/reference/index.md
- Import from `@psychollama/ui`.
- Prefer semantic elements via the `as` prop (`p`, `main`, `footer`, etc). Avoid `div`.
- Design mobile-first. Use `breakpoint` tokens in `@media` blocks for responsive overrides.
- Avoid needless wrapper elements.

## Design System

- Reference docs: ./packages/design/src/docs/usage.md
- Import tokens from `@psychollama/design`. NEVER hard-code colors, spacing, radius, shadows, motion, or typography values.
- Avoid needless CSS reset rules. We use `the-new-css-reset`. It is thorough.

## State Management

- Reference docs: ./packages/state/src/docs/usage.md
- Import from `@psychollama/state`.
- Side effects belong in activities, not workflows or stores.

## Icons

- Import SVG icon components from `virtual:icons/mdi/*`.
- Prefer material design icons.

## Testing

- Co-locate tests. Example: `foo.ts` and `__tests__/foo.test.ts`.
