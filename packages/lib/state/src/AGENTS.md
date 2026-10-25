## Guidance

- `index.ts` is the only public API. All exports go through it. Imported as `@lib/state`.
- State is `@lib/effects` plans. A plan yielding a cell or store is a target; commands and extensions write targets, and live as long as something holds them.
- Reads are read-only everywhere. Writable views exist only in commits, plus a cell's setter in the step that created it.
- Brands are type-only: `Cell` and `Store` carry phantom symbols. Only `createCell` and `defineStore` mint them. Cells also register their signal so commits can recover the setter.
- Reference docs live in the `state-reference` skill at `.claude/skills/state-reference/SKILL.md`. Keep the skill updated when the API changes.
  - Audience: expert frontend devs unfamiliar with this library.
  - Happy path only. No edge cases, error behavior, or implementation details.
  - Raw facts under markdown headers, 1-2 sentences max, few-to-no examples.

## Authoring Stores

- Every store-state interface and every field gets a doc comment. Same for any types the state references (status unions, entity shapes, etc).
- Doc comments describe the role of the value, not its TypeScript type. One sentence is usually enough.

## Authoring Topics

- Topics stay internal. Commands are the public topics; exporting one makes it the feature's outbound contract for other features' extensions.
