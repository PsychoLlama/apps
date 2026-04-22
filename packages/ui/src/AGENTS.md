## Guidance

- `index.ts` is the only public API. All exports go through it. Imported as `#ui`.
- Never hard-code colors, spacing, radius, shadows, motion, or typography values. Use `#design` tokens.
- Polymorphic components must require the `as` prop.

## Doc Comments

- Components and props must have doc comments.
- Do not include implementation details.
- Mention default value if applicable.
- Multi-line is acceptable.
- Include module doc comments to cite 3p sources and upstream deviations.

## Storybook

- Components must have at least one story.
- Use `meta.title` to group (e.g. `UI/Layout`). Options: Layout, Typography, Components, Utilities
- The named export is the story name.
- Keep `argTypes` in sync with component props.

## Reference Docs

- Located at `docs/reference/`. One file per component, plus `index.md` and `standard-props.md`.
- Optimized for token efficiency. No examples, no usage guides — props and descriptions only.
- Keep docs updated with components and standard props.
