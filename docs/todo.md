## Solid button active state filter

Solid variant buttons have no visual distinction between hover and active
because both use `{color}[10]` — the top of the solid fill range. Radix
solves this with a color-scheme-aware CSS filter: `brightness(0.92)
saturate(1.1)` in light mode, `brightness(1.08)` in dark mode.

Add a `solidActiveFilter` CSS custom property scoped to the button
component via `globalStyle` + the color-scheme selectors from
`#design/color-scheme.css`. Apply it in `solidStyle`'s `:active` rule.
This keeps the filter out of the global design system while only paying
the cost when the button component is used.

## Motion design tokens

Button hardcodes `120ms` for transition duration with no shared constant.
Add a motion token file (`src/design/tokens/motion.css.ts`) with duration
and easing tokens so interactive components share consistent timing. The
solid active filter work above would also benefit from this.

## Callout component

Non-dismissible message banner with icon, title, and description.
Warning/error/info intents. Radix UI is the reference implementation.

## Icons

- **Warning** — Alert/exclamation indicator for callouts.
- **Play** — Playback triangle for recording thumbnails.
- **Close** — × mark for dismiss and remove actions.
