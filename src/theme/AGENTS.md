## File map

- `palette/`: Raw Radix color scales. One file per color. Edit via codemods, never by hand.
- `tokens/color.css.ts`: All semantic token contracts, palette assignments, and `globalStyle` side effects. Uses `light-dark()` so each var is declared once for both modes.
- `tokens/typography.css.ts`: Type scale, font family, and font weight tokens. Applies body typography defaults.
- `tokens/space.css.ts`: 9-step spacing scale (4px base, rem units). Plain constants, no CSS variables.
- `index.ts`: The only public API. Exports flat destructured token names. Imports from `tokens/color.css`, applying its side effects.
- Token names are semantic (`neutral` not `gray`, `accent` not `blue`).

## Deviations from Radix UI

- **No `--scaling` variable.** We use `rem` instead.
- **Custom font.** IBM Plex Sans instead of system font stacks.
- **No P3 colors or `color-mix()` progressive enhancement.**
