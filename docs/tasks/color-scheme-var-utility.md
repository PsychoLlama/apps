## Color-scheme variable utility

Expose a utility in `#design` to define CSS custom properties that
branch on light/dark mode — the same pattern used by shadow tokens
(`color-scheme.css` selectors + `globalStyle` + `assignVars`). This
avoids leaking `:root` selector details into component code.

The shadow module (`src/design/tokens/shadow.css.ts`) is the reference
implementation. Extract the shared plumbing so other tokens or
components can define mode-dependent vars without duplicating the
three-rule `globalStyle` pattern.
