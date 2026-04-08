## Conventions

- `index.ts` is the only public API. All exports go through it.
- Import as `#ui` from application code.
- All styling must use `#design-system` tokens. Never hard-code colors, spacing, radius, shadows, or typography values.
- Polymorphic components must require the `as` prop — no defaults. Consumers should make a deliberate choice about semantic markup.
