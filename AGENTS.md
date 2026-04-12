## Stack

- pnpm
- SolidStart
- Vanilla Extract
- Storybook
- Unplugin Icons
- Wrangler/CF Workers

## Dev

- `just check` to validate. Must pass before committing.
- Routes are file-based: `src/routes/**/*.tsx`.

## UI Components

- Reference docs: ./src/ui/docs/reference/index.md
- Import from `#ui`.
- Prefer semantic elements via the `as` prop (`p`, `main`, `footer`, etc). Avoid `div`.
- Design mobile-first. Use `breakpoint` tokens in `@media` blocks for responsive overrides.
- Avoid needless wrapper elements.

## Design System

- Reference docs: ./src/design/docs/usage.md
- Import tokens from `#design`. NEVER hard-code colors, spacing, radius, shadows, motion, or typography values.
- Avoid needless CSS reset rules. We use `the-new-css-reset`. It is thorough.

## Icons

- Import SVG icon components from `virtual:icons/mdi/*`.
- Prefer material design icons.

## Testing

- Co-locate tests. Example: `foo.ts` and `__tests__/foo.test.ts`.
