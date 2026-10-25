## Guidance

- Entry points are the public API: `index.ts`, `solid/index.ts`, `testing/index.ts`, and `controller/index.ts`. All exports go through them.
- Layers, bottom up: `plan` builds pure graphs, `manager` caches and ref-counts their entries, `controller` binds a manager's operations, and `solid` and `testing` drive a controller. Lower layers never import higher ones.
- An entry is one life of a node over one exact input, keyed by plan and upstream output identity. It never recomputes; a new life starts only after the old one retires.
- Modes are type-only. Keep `sync` paths synchronous at runtime: compose with the `Eventual` helpers (`now`, `chain`, `all`, `rescue`, ...) instead of `async`/`await`.
- Abandoned work isn't a failure. Bindings drop `AbandonedError`; everything else reaches an error boundary or rejects.
- Co-locate tests. Example: `foo.ts` and `__tests__/foo.test.ts`. Type-level guarantees get `expectTypeOf` tests.
- Reference docs live in the `effects-reference` skill at `.claude/skills/effects-reference/SKILL.md`. Keep the skill updated when the API changes.
  - Audience: expert frontend devs unfamiliar with this library.
  - Happy path only. No edge cases, error behavior, or implementation details.
  - Raw facts under markdown headers, 1-2 sentences max, few-to-no examples.
