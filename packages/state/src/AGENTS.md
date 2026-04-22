## Guidance

- `index.ts` is the only public API. All exports go through it. Imported as `@lib/state`.
- Stores hold state. Actions mutate state. Effects wrap impure work and dispatch actions at lifecycle boundaries.
- Multi-store coordination happens inside a single action's store tuple — no pub/sub, no fan-out.
- Co-locate tests. Example: `foo.ts` and `__tests__/foo.test.ts`.
- Reference docs at `./docs/usage.md`. Keep them updated when the API changes.
  - Audience: expert frontend devs unfamiliar with this library.
  - Happy path only. No edge cases, error behavior, or implementation details.
  - Raw facts under markdown headers, 1-2 sentences max, few-to-no examples.

## Authoring Stores

- Every store-state interface and every field gets a doc comment. Same for any types the state references (status unions, entity shapes, etc).
- Doc comments describe the role of the value, not its TypeScript type. One sentence is usually enough.
