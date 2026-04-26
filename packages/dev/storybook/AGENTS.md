## Layout

- Stories live under `src/stories/`. Directory tree mirrors `meta.title`:
  `'Foo/Bar'` → `src/stories/foo/bar/<name>.stories.tsx` (segments slugified).
- Helpers (e.g. `swatch.tsx`, `token-row.tsx`) live flat at `src/<name>.{ts,tsx}`.
- Story sibling `*.stories.css.ts` files are allowed and travel with their story.

## Imports

- Import library code by package name (`@lib/ui`, `@lib/design`). Never reach
  into a library's internals via deep relative paths.
- Reach local helpers via relative paths.

## Conventions

- Components must have at least one story; tokens must too.
- Use `meta.title` to group. The named export is the story name.
- Keep `argTypes` in sync with component props (argTypes utilities live in
  `@lib/ui/props/*`).
