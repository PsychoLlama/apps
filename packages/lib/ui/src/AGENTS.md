## Guidance

- `index.ts` is the only public API. All exports go through it. Imported as `@lib/ui`.
- Never hard-code colors, spacing, radius, shadows, motion, or typography values. Use `@lib/design` tokens.
- Polymorphic components must require the `as` prop.
- `vars/*.css.ts` defines `createVar()` contracts shared between components (e.g. `lineHeight` set by `<Text>` and read by aligning components). Use it when a var is assigned in one component and read in another; otherwise keep `createVar()` colocated with its style file.

## Doc Comments

- Components and props must have doc comments.
- Do not include implementation details.
- Mention default value if applicable.
- Multi-line is acceptable.
- Include module doc comments to cite 3p sources and upstream deviations.

## Storybook

- Keep stories in sync with `packages/dev/storybook`.

## Reference Docs

- The `ui-reference` skill is the entry point. Per-component files live at `$REPO/.claude/skills/ui-reference/reference/`, alongside `standard-props.md`.
- Optimized for token efficiency. No examples, no usage guides — props and descriptions only.
- Keep docs updated with components and standard props.
