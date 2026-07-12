## Guidance

- `index.ts` is the only public API. All exports go through it. Imported as `@lib/state2`.
- The model is space/time/life: stores, cells, and formulas hold values (space); topics and folds turn facts into state transitions (time); scopes and sagas own processes and lifetimes (life).
- The one law: life produces time, time mutates space, space never reaches back. Sagas cannot touch stores — they publish facts and read snapshots through instructions.
- Facts and saga invocations are inert values interpreted by the driver. That's what keeps everything observable, simulable, and lintable — preserve it when extending the instruction set.
- Reads are readonly everywhere; writable drafts exist only as fold handler arguments.
- Co-locate tests. Example: `foo.ts` and `__tests__/foo.test.ts`.
- Reference docs live in the `state2-reference` skill at `.claude/skills/state2-reference/SKILL.md`. Keep the skill updated when the API changes.
  - Audience: expert frontend devs unfamiliar with this library.
  - Happy path only. No edge cases, error behavior, or implementation details.
  - Raw facts under markdown headers, 1-2 sentences max, few-to-no examples.

## Authoring Stores

- Every store-state interface and every field gets a doc comment. Same for any types the state references (status unions, entity shapes, etc).
- Doc comments describe the role of the value, not its TypeScript type. One sentence is usually enough.

## Authoring Topics

- Topics are module-private by default. Exporting one is a deliberate API act — it becomes the feature's outbound contract for cross-feature folds.

## Authoring Sagas

- Prefer `call(capability, ...args)` over bare `await`: it injects the scope's `AbortSignal`, shows up in traces, and is stubbed by `simulate`. Bare `await` is reserved for `for await` event streams.
- One `yield commit(...)` per logical transition. Consecutive commits are the old `dispatch(); dispatch();` smell — carry multiple facts in one commit instead.
- Compose for a single transition with `atomic(...)`; compose for pass-through with `all(...)` or sequential `yield*`.
