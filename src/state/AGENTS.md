## Guidance

- `index.ts` is the only public API. All exports go through it. Imported as `#state`.
- Workflows are the primary abstraction. Prefer them over direct topic/publish/subscribe usage.
- Direct event bus usage is for testing and internal wiring.
- Co-locate tests. Example: `foo.ts` and `__tests__/foo.test.ts`.
- Design docs at `../../docs/state-management/`.
- Reference docs at `./docs/usage.md`. Keep them updated when the API changes.
  - Audience: expert frontend devs unfamiliar with this library.
  - Happy path only. No edge cases, error behavior, or implementation details.
  - Raw facts under markdown headers, 1-2 sentences max, few-to-no examples.
