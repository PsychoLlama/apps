## Design System

Our design system closely follows [Radix Themes](https://www.radix-ui.com/themes/docs/theme/overview), reimplemented in Vanilla Extract. We're building our own tokens and utilities rather than consuming Radix packages.

Theme tokens and utilities live in `src/design-system/`, organized by concept and importable via `#design-system`.

### Concepts

Mirroring the Radix Themes structure:

- **Color** — Color scales, semantic aliases, dark/light mode
- **Typography** — Font families, sizes, weights, line heights
- **Spacing** — Consistent spacing scale
- **Radius** — Corner roundness scale
- **Shadows** — Elevation and depth
- **Cursors** — Interactive element pointers

### Design Principles

1. **Minimal chrome:** Content and actions dominate. No decorative clutter.
2. **High contrast states:** Recording vs. idle must be unmistakable. Use red accent for active recording state.
3. **Single-screen focus:** Each view has one purpose. No competing contexts.
4. **Native-feeling:** Subtle depth, clear affordances. Avoid ultra-flat or overly skeuomorphic design.

### Color Usage

- **Idle/default:** Neutral grays
- **Recording active:** Red accent for indicator, subtle red tint on controls
- **Interactive elements:** Clear focus and hover states
- **Error states:** Red with appropriate contrast for error messages

### Typography

- Use system font stack for performance and native feel
- Clear hierarchy: headings for view titles, body text for metadata, monospace for timestamps/durations

### Spacing

- Generous touch targets (minimum 44px) for primary actions
