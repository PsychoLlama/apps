## Developing

- Use `pnpm`.
- Run `just fmt` to format and `just check` to validate. All checks must pass before committing.
- Write commit messages that explain _why_, not just _what_.

## Testing

- Co-locate tests with the code they cover. Place a `__tests__/` directory as a sibling of the module under test (e.g., `app/machines/__tests__/counter.test.ts` tests `app/machines/counter.ts`).
