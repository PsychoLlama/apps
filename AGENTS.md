## Developing

- Use `pnpm`.
- Run `just fmt` to format and `just check` to validate. All checks must pass before committing.
- Write commit messages that explain _why_, not just _what_.

## Testing

- Co-locate tests with the code they cover. Example: `foo.ts` and `__tests__/foo.test.ts`.
- Use vitest globals (`test`, `expect`, etc.) not imports.
