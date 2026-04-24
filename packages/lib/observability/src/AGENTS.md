## Guidance

- `index.ts` is the only public API. Imported as `@lib/observability`.
- Re-export the canonical OpenTelemetry surface (`@opentelemetry/api-logs`) so callers use standard shapes.
- Provider implementations live in `internal/`. Public API surface stays OTel-shaped.
- `configure()` is the single wire-up point. Entry points call it once before any module emits telemetry.
- Co-locate tests. Example: `setup.ts` and `__tests__/setup.test.ts`.
- Reference docs at `./docs/usage.md`. Keep them updated when the API changes.
  - Audience: expert frontend devs unfamiliar with this library.
  - Happy path only. No edge cases, error behavior, or implementation details.
  - Raw facts under markdown headers, 1-2 sentences max, few-to-no examples.

## Adding a Provider

- New providers live in `internal/<name>-provider.ts` and export a factory (`create…Provider`).
- Wire them into `configure()` as a string alias, plus accept an explicit instance.
- Keep them runtime-agnostic. Anything that depends on browser/Node/Workers globals goes behind a capability passed in at configure time.

## Adding a Signal

- New signals land here as new fields on `ConfigureOptions` (`logs`, `traces`, future `metrics`).
- Re-export the canonical OTel surface for each new signal from `index.ts`.
- The "why DIY?" doc-block at the top of `setup.ts` is the single source of truth for the bundle/risk tradeoff. Update it when the calculus shifts.
