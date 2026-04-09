## Lint rule: ban hard-coded values in vanilla-extract fields

Add a custom lint rule that forbids hard-coded values (raw pixel/rem/em
literals, hex colors, etc.) in vanilla-extract style fields owned by the
design system — padding, margin, gap, color, font-size, border-radius,
box-shadow, and similar. Values must come from design tokens.
