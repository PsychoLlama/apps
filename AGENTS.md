## Developing

- Use `pnpm`.
- Run `just fmt` to format and `just check` to validate. All checks must pass before committing.
- Write commit messages that explain _why_, not just _what_.

## Design System

- Usage guide: `src/design/docs/usage.md`.
- Import tokens from `#design`. NEVER hard-code colors, spacing, radius, shadows, or typography values.
- Use `space` tokens instead of absolute units for sizing.

## UI Components

- Import from `#ui`. Prefer `Box`, `Flex`, `Grid`, `Text`, and `Heading` over raw HTML elements.
- Use semantic elements via the `as` prop: `nav`, `main`, `section`, `aside`, `article`, `header`, `footer` — not just `div`.
- Design mobile-first. Use `breakpoint` tokens in `@media` blocks for responsive overrides.

## Icons

- Import icons from `virtual:icons/{collection}/{icon}`.
- Prefer Material Design icons (`virtual:icons/mdi/*`).
- Icons render as SolidJS SVG components via `unplugin-icons`.

## Testing

- Co-locate tests with the code they cover. Example: `foo.ts` and `__tests__/foo.test.ts`.
- Use vitest globals (`test`, `expect`, etc.) not imports.
