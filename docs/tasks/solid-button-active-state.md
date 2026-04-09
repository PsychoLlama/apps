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
