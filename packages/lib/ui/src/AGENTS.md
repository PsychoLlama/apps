## Guidance

- `index.ts` is the only public API. All exports go through it. Imported as `@lib/ui`.
- Never hard-code colors, spacing, radius, shadows, motion, or typography values. Use `@lib/design` tokens.
- Polymorphic components must require the `as` prop.

## Doc Comments

- Components and props must have doc comments.
- Do not include implementation details.
- Mention default value if applicable.
- Multi-line is acceptable.
- Include module doc comments to cite 3p sources and upstream deviations.

## Storybook

- Keep stories in sync with `packages/dev/storybook`.

## Reference Docs

- Located at `docs/reference/`. One file per component, plus `index.md` and `standard-props.md`.
- Optimized for token efficiency. No examples, no usage guides — props and descriptions only.
- Keep docs updated with components and standard props.
