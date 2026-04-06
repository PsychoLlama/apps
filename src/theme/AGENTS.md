## File map

- `palette/`: Raw Radix color scales. One file per color. Edit via codemods, never by hand.
- `tokens/color.css.ts`: All semantic token contracts, palette assignments, and `globalStyle` side effects. Uses `light-dark()` so each var is declared once for both modes.
- `tokens/typography.css.ts`: Type scale, font family, and font weight tokens. Applies body typography defaults.
- `tokens/space.css.ts`: 9-step spacing scale (4px base, rem units). Plain constants, no CSS variables.
- `tokens/radius.css.ts`: 6-step border radius scale (3–16px) plus `full` for pills. Plain constants.
- `tokens/shadow.css.ts`: 6-level elevation scale. Levels with identical geometry in both modes are plain constants using `light-dark()` on colors. Levels where Radix uses structurally different shadows per mode (shadow 1, shadow 3) are CSS custom properties assigned via `prefers-color-scheme` media queries with `data-color-scheme` attribute overrides.
- `tokens/breakpoint.css.ts`: 5 mobile-first media query conditions (xs–xl). Plain constants for use in Vanilla Extract `@media` blocks.
- `index.ts`: The only public API. Imports side-effect files (`reset.css`, `tokens/color.css`, `tokens/typography.css`). Re-exports all tokens (re-exporting `tokens/shadow.css` also triggers its side effects).
- Token names are semantic (`neutral` not `gray`, `accent` not `blue`).

## Deviations from Radix UI

- **No `--scaling` variable.** We use `rem` instead.
- **Custom font.** IBM Plex Sans instead of system font stacks.
- **No P3 colors or `color-mix()` progressive enhancement.**
