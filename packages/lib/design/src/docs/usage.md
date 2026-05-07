# Design System Usage

- Single entry point: `@lib/design`.
- Never hard-code a value when a token exists.

## Colors

- Light/dark mode is automatic.
- `accent[1-12]`, `accentAlpha[1-12]`: Brand color scale and alpha variant.
- `neutral[1-12]`, `neutralAlpha[1-12]`: Grayscale tinted toward accent.
- `danger[1-12]`: Destructive actions and error states.
- `warning[1-12]`: Caution and warning states.
- `success[1-12]`: Positive outcomes and active status.
- `text.lowContrast`, `text.highContrast`: Text colors.
- `background.page`, `background.panelSolid`, `background.panelTranslucent`, `background.surface`, `background.overlay`: Surface layers.
- `black[1-12]`, `white[1-12]`: Pure black/white alpha scales (transparent → opaque).
- Semantic tokens alias palette CSS vars (`accent` → `blue`, `danger` → `red`, `warning` → `amber`, `success` → `grass`, `neutral` → `slate`).
- Scale semantics (applies to accent, neutral, danger, warning, success):
  - 1–2: Backgrounds.
  - 3–5: Component fills (idle, hover, active).
  - 6–8: Borders (subtle, default, strong).
  - 9–10: Solid fills (idle, hover).
  - 11–12: Text (low-contrast, high-contrast).

## Typography

- `typeScale[1-9]`: Each step bundles `fontSize`, `lineHeight`, `letterSpacing`. Always consume a full step.
- `fontFamily.body`, `.heading`, `.code`, `.em`, `.quote`: Font stacks. Body/heading run system sans; code runs system mono; em/quote run a serif italic.
- `fontWeight.light`, `.regular`, `.medium`, `.bold`: Numeric weights.
- `baselineOffset`: Leading-trim polyfill offset for the body sans (`0.36em`).
- `letterSpacingOffset.code`, `letterSpacingOffset.quote`: Per-style tracking nudges. Compose with `var(--letter-spacing)` to keep monospace and italic flows in tracking with the surrounding text.
- `fontSizeAdjust.em`, `.quote`, `.code`: Per-style font-size multipliers. Compose as `calc(adjust * 1em)` to compensate for visual size differences between the body sans and the per-style family.

## Space

- `space[1-9]`: 4px-base scale in rem.

## Radius

- `radius[1-6]`: 1–2 for controls, 3 crossover, 4–6 for containers.
- `radius.full`: Pill shape.

## Shadow

- `shadow[1-6]`: Elevation scale. 1 inset (inputs), 2–3 raised surfaces, 4–5 floating layers, 6 modals.

## Motion

Adapted from IBM Carbon (Apache-2.0). Compose a duration + easing per transition. Durations collapse to `0s` when `prefers-reduced-motion: reduce` is active.

### Duration

- `fast[1]` (70ms), `fast[2]` (110ms): Micro-interactions.
- `moderate[1]` (150ms), `moderate[2]` (240ms): Standard transitions.
- `slow[1]` (400ms), `slow[2]` (700ms): Large/ambient motion.

### Easing

- `standard`: Element visible throughout. `entrance`: appearing. `exit`: leaving.
- `.productive` (default) or `.expressive` (significant moments).

## Breakpoints

- `breakpoint.xs` (520), `.sm` (768), `.md` (1024), `.lg` (1280), `.xl` (1640): Mobile-first `min-width` queries.
