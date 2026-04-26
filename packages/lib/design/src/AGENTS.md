## Conventions

- Use `.css.ts` as the default file extension in this directory. Everything here is processed by Vanilla Extract.
- `palette/*.ts`: Raw Radix color scales. Edit via codemods, never by hand.
- `palette/*.css.ts`: Registered palettes. Each calls `createPalette()` to define CSS custom properties on `:root`. Importing a palette triggers the side effect; unused palettes produce no CSS.
- `index.css.ts`: The public API for runtime tokens. Do not import other files directly.
- `@lib/design/color-scheme`: Build-time utilities (`assignColorSchemeVars`, `createPalette`, `lightDark`). Import in `.css.ts` files. This is a plain `.ts` file — not `.css.ts` — because it exports functions.
- Token stories live in `@dev/storybook/src/stories/design-system/`, not here.

## Color scheme strategy

- Default mode is system-managed via `prefers-color-scheme`.
- Application code can force a mode by setting `data-color-scheme="light|dark"` on `:root`.
- Tokens that differ only in color use `light-dark()`. Tokens that differ in structure (e.g. shadow geometry) use CSS custom properties assigned per mode.
- Each permutation (system-light, system-dark, forced-light, forced-dark) must be targeted by exactly one CSS rule. No duplicates in the inspector.
- `color-scheme.ts` exports the selectors and media queries that enforce this. Use them instead of hardcoding selectors.
- `assignColorSchemeVars(light, dark)` emits the three `globalStyle` rules for mode-dependent vars. Only use it when light/dark modes need structurally different CSS; prefer `light-dark()` for color-only differences.
- Semantic color tokens alias palette CSS vars. Changing a palette assignment (e.g. `danger` → a different hue) updates all downstream references.

## Usage Doc

- Located at `docs/usage.md`.
- Keep updated when tokens are added, removed, or renamed.

## Deviations from Radix UI

- **No `--scaling` variable.** We use `rem` instead.
- **Custom font.** IBM Plex Sans instead of system font stacks.
- **No P3 colors or `color-mix()` progressive enhancement.**
