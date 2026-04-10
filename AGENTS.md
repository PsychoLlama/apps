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

- Import from `#ui`. Prefer `Box`, `Flex`, `Grid`, `Text`, and `Heading` over raw HTML elements.
- Use semantic elements via the `as` prop: `nav`, `main`, `section`, `aside`, `article`, `header`, `footer` — not just `div`.
- Design mobile-first. Use `breakpoint` tokens in `@media` blocks for responsive overrides.

## Design System

- Usage guide: `src/design/docs/usage.md`.
- Import tokens from `#design`. NEVER hard-code colors, spacing, radius, shadows, or typography values.
- Use `space` tokens instead of absolute units for sizing.

## Icons

- Import SVG icon components from `virtual:icons/mdi/*`.
- Prefer material design icons.

## Testing

- Co-locate tests. Example: `foo.ts` and `__tests__/foo.test.ts`.
