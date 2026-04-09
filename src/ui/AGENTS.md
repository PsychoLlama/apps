## Conventions

- `index.ts` is the only public API. All exports go through it.
- Import as `#ui` from application code.
- All styling must use `#design` tokens. Never hard-code colors, spacing, radius, shadows, or typography values.
- Polymorphic components must require the `as` prop — no defaults. Consumers should make a deliberate choice about semantic markup.
- Every component must have at least one story. Use `title` for the sidebar group (e.g. `UI/Layout`) and the named export for the story name (e.g. `export const Flex`). Keep argTypes in sync with component props.
