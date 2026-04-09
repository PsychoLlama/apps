## Conventions

- Use `.css.ts` as the default file extension in this directory. Everything here is processed by Vanilla Extract.

## File map

- `palette/`: Raw Radix color scales. One file per color. Edit via codemods, never by hand.
- `tokens/color.css.ts`: Semantic token contracts and palette assignments. Uses `light-dark()` so each var is declared once for both modes. Pure definitions — no element styling.
- `tokens/typography.css.ts`: Type scale, font family, and font weight tokens. Pure definitions — no element styling.
- `tokens/space.css.ts`: 9-step spacing scale (4px base, rem units). Plain constants, no CSS variables.
- `tokens/radius.css.ts`: 6-step border radius scale (3–16px) plus `full` for pills. Plain constants.
- `tokens/shadow.css.ts`: 6-level elevation scale. Levels with identical geometry in both modes are plain constants using `light-dark()` on colors. Levels where Radix uses structurally different shadows per mode (shadow 1, shadow 3) are CSS custom properties assigned via `prefers-color-scheme` media queries with `data-color-scheme` attribute overrides.
- `tokens/motion.css.ts`: Animation tokens.
- `tokens/breakpoint.css.ts`: 5 mobile-first media query conditions (xs–xl). Plain constants for use in Vanilla Extract `@media` blocks.
- `tokens/*.stories.css.ts`: Co-located story styles for layout that `#ui` components cannot express (custom grids, visualization primitives). Stories prefer `#ui` components (`Flex`, `Grid`, `Box`, `Text`, `Heading`) over custom CSS.
- `globals.css.ts`: Design opinions applied to elements. Collects root baseline (color-scheme, background, font smoothing, etc.), body layout and typography defaults, color-scheme overrides, and selection highlight. Imports tokens but does not define them.
- `index.css.ts`: The only public API. Imports side-effect files (`reset.css`, `globals.css`). Re-exports all tokens (re-exporting token modules also triggers their `globalStyle` var assignments).
- `color-scheme.css.ts`: Shared selectors and media queries for color-scheme-aware tokens.
- Token names are semantic (`neutral` not `gray`, `accent` not `blue`).

## Color scheme strategy

- Default mode is system-managed via `prefers-color-scheme`.
- Application code can force a mode by setting `data-color-scheme="light|dark"` on `:root`.
- Tokens that differ only in color use `light-dark()`. The browser resolves them from the `color-scheme` property.
- Tokens that differ in structure (e.g. shadow geometry) use CSS custom properties assigned per mode.
- Each permutation (system-light, system-dark, forced-light, forced-dark) must be targeted by exactly one CSS rule. No duplicates in the inspector.
- `color-scheme.css.ts` exports the selectors and media queries that enforce this. Use them instead of hardcoding selectors.

## Deviations from Radix UI

- **No `--scaling` variable.** We use `rem` instead.
- **Custom font.** IBM Plex Sans instead of system font stacks.
- **No P3 colors or `color-mix()` progressive enhancement.**
