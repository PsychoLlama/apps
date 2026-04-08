## Developing

- Use `pnpm`.
- Run `just fmt` to format and `just check` to validate. All checks must pass before committing.
- Write commit messages that explain _why_, not just _what_.

## Design System

- Usage guide: `src/design-system/docs/usage.md`.
- Import tokens from `#design-system`. NEVER hard-code colors, spacing, radius, shadows, or typography values.
- Use `space` tokens instead of absolute units for sizing.

## Icons

- Import icons from `virtual:icons/{collection}/{icon}`.
- Prefer Material Design icons (`virtual:icons/mdi/*`).
- Icons render as SolidJS SVG components via `unplugin-icons`.

## Testing

- Co-locate tests with the code they cover. Example: `foo.ts` and `__tests__/foo.test.ts`.
- Use vitest globals (`test`, `expect`, etc.) not imports.
