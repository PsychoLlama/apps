# Design System Usage

- Single entry point: `#design`.
- Never hard-code a value when a token exists.

## Colors

- Light/dark mode is automatic.
- `accent[1-12]`, `accentAlpha[1-12]`: Brand color scale and alpha variant.
- `neutral[1-12]`, `neutralAlpha[1-12]`: Grayscale tinted toward accent.
- `text.lowContrast`, `text.highContrast`: Text colors.
- `background.page`, `background.panelSolid`, `background.panelTranslucent`, `background.surface`, `background.overlay`: Surface layers.
- Scale semantics (applies to accent and neutral):
  - 1–2: Backgrounds.
  - 3–5: Component fills (idle, hover, active).
  - 6–8: Borders (subtle, default, strong).
  - 9–10: Solid fills (idle, hover).
  - 11–12: Text (low-contrast, high-contrast).

## Typography

- `typeScale[1-9]`: Each step bundles `fontSize`, `lineHeight`, `letterSpacing`. Always consume a full step.
- `fontFamily.body`, `fontFamily.heading`: Font stacks.
- `fontWeight.light`, `.regular`, `.medium`, `.bold`: Numeric weights.

## Space

- `space[1-9]`: 4px-base scale in rem.

## Radius

- `radius[1-6]`: 1–2 for controls, 3 crossover, 4–6 for containers.
- `radius.full`: Pill shape.

## Shadow

- `shadow[1-6]`: Elevation scale. 1 inset (inputs), 2–3 raised surfaces, 4–5 floating layers, 6 modals.

## Motion

Adapted from IBM Carbon (Apache-2.0). Compose a duration + easing per transition.

### Duration

- `fast[1]` (70ms), `fast[2]` (110ms): Micro-interactions.
- `moderate[1]` (150ms), `moderate[2]` (240ms): Standard transitions.
- `slow[1]` (400ms), `slow[2]` (700ms): Large/ambient motion.

### Easing

- `standard`: Element visible throughout. `entrance`: appearing. `exit`: leaving.
- `.productive` (default) or `.expressive` (significant moments).

## Breakpoints

- `breakpoint.xs` (520), `.sm` (768), `.md` (1024), `.lg` (1280), `.xl` (1640): Mobile-first `min-width` queries.
