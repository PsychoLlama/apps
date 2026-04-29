import { RuleTester } from '@typescript-eslint/rule-tester';
import rule, { propertyToToken } from '../require-design-tokens';

const tester = new RuleTester();

tester.run('require-design-tokens', rule, {
  valid: [
    // Token references (MemberExpression) are fine.
    { code: 'const x = { padding: space[1] }' },
    { code: 'const x = { color: accent[9] }' },
    { code: 'const x = { borderRadius: radius[2] }' },
    { code: 'const x = { fontSize: typeScale[3].fontSize }' },
    { code: 'const x = { fontWeight: fontWeight.bold }' },
    { code: 'const x = { boxShadow: shadow[3] }' },

    // Identifiers (variables) are fine.
    { code: 'const x = { padding: myVar }' },

    // Function calls are fine.
    { code: 'const x = { color: darken(accent[9]) }' },

    // Template literals are fine (assumed dynamic).
    { code: 'const x = { padding: `${base}rem` }' },

    // Non-design-system properties accept any value.
    { code: 'const x = { display: "flex" }' },
    { code: 'const x = { position: "absolute" }' },
    { code: 'const x = { overflow: "hidden" }' },
    { code: 'const x = { width: "100%" }' },
    { code: 'const x = { zIndex: 1 }' },
    { code: 'const x = { opacity: 0.5 }' },

    // Height properties with non-viewport values are fine.
    { code: 'const x = { height: "100%" }' },
    { code: 'const x = { minHeight: "100%" }' },
    { code: 'const x = { height: "50vh" }' },
    { code: 'const x = { minHeight: "calc(100dvh - 40px)" }' },
    { code: 'const x = { height: "auto" }' },

    // Array fallbacks without a full-viewport value are fine (the
    // body-reset pattern itself is exempt via eslint config, so this
    // rule only needs to flag the offending *shape* in app code).
    { code: "const x = { minHeight: ['50vh', '75%'] }" },
    { code: "const x = { height: [myVar, '100%'] }" },

    // CSS keywords are allowed on token properties.
    { code: 'const x = { color: "inherit" }' },
    { code: 'const x = { color: "transparent" }' },
    { code: 'const x = { color: "currentColor" }' },
    { code: 'const x = { margin: "auto" }' },
    { code: 'const x = { fontWeight: "normal" }' },
    { code: 'const x = { boxShadow: "none" }' },

    // Null values (createThemeContract) are allowed.
    { code: 'const x = { color: null }' },
    { code: 'const x = { padding: null }' },

    // Motion — token references are fine.
    { code: 'const x = { transitionDuration: fast[1] }' },
    { code: 'const x = { transitionTimingFunction: standard.productive }' },
    { code: 'const x = { animationDuration: moderate[2] }' },
    { code: 'const x = { animationTimingFunction: entrance.expressive }' },

    // Motion — template literals composing tokens are fine.
    {
      code: 'const x = { transition: `color ${fast[1]} ${standard.productive}` }',
    },

    // Motion — CSS keywords are fine.
    { code: 'const x = { transition: "none" }' },
    { code: 'const x = { animation: "none" }' },

    // Redundant-reset values are allowed inside specialization blocks
    // *only when* the same style object declares a same-family property
    // elsewhere — that's the author's own style being undone.
    {
      code: "const x = { padding: pad, selectors: { '&:hover': { padding: 0 } } }",
    },
    {
      code: "const x = { margin: m, selectors: { '&:hover': { margin: '0px' } } }",
    },
    {
      code: "const x = { padding: pad, '@media': { '(min-width: 600px)': { padding: 0 } } }",
    },
    {
      code: "const x = { gap: g, '@supports': { '(display: grid)': { gap: 0 } } }",
    },
    {
      code: "const x = { padding: pad, '@container': { '(min-width: 400px)': { padding: 'unset' } } }",
    },
    // Longhand can override a shorthand from the outer scope.
    {
      code: "const x = { padding: pad, selectors: { '&:hover': { paddingTop: 0 } } }",
    },
    // Specialization exemption works through several nesting levels.
    {
      code: "const x = { padding: pad, '@media': { '(min-width: 600px)': { selectors: { '&:hover': { padding: 0 } } } } }",
    },
    // `'&'` is a sibling-selector form of the top-level scope; padding set
    // there counts as an override target for `&:hover`.
    {
      code: "const x = { selectors: { '&': { padding: pad }, '&:hover': { padding: 0 } } }",
    },

    // `unset` on properties whose spec initial value is *not* `0`
    // (`border-width: medium`, `gap: normal`, `outline-width: medium`)
    // is meaningful — it doesn't equal `0`, so it isn't a redundant
    // reset even though `0` itself is.
    { code: 'const x = { borderWidth: "unset" }' },
    { code: 'const x = { borderTopWidth: "unset" }' },
    { code: 'const x = { outlineWidth: "unset" }' },
    { code: 'const x = { gap: "unset" }' },
    { code: 'const x = { rowGap: "unset" }' },

    // Override target inside the *same* variant scope is exempt.
    {
      code: "const x = styleVariants({ secondary: { padding: pad, selectors: { '&:hover': { padding: 0 } } } })",
    },
    // Recipe-style: base + variants. An override target in the base
    // scope counts only for a redundant reset *inside that base*.
    {
      code: "const x = recipe({ base: { padding: pad, selectors: { '&:hover': { padding: 0 } } } })",
    },
  ],

  invalid: [
    // Spacing — pixel string.
    {
      code: 'const x = { padding: "10px" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'padding', token: 'space' },
        },
      ],
    },

    // Spacing — numeric.
    {
      code: 'const x = { padding: 16 }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'padding', token: 'space' },
        },
      ],
    },

    // Spacing — rem string.
    {
      code: 'const x = { gap: "1.5rem" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'gap', token: 'space' },
        },
      ],
    },

    // Color — hex.
    {
      code: 'const x = { color: "#ff0000" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'color', token: 'color' },
        },
      ],
    },

    // Color — backgroundColor.
    {
      code: 'const x = { backgroundColor: "rgb(0,0,0)" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'backgroundColor', token: 'color' },
        },
      ],
    },

    // Typography — fontSize.
    {
      code: 'const x = { fontSize: "14px" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'fontSize', token: 'typeScale' },
        },
      ],
    },

    // Typography — lineHeight.
    {
      code: 'const x = { lineHeight: 1.5 }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'lineHeight', token: 'typeScale' },
        },
      ],
    },

    // Font family.
    {
      code: 'const x = { fontFamily: "Arial, sans-serif" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'fontFamily', token: 'fontFamily' },
        },
      ],
    },

    // Font weight.
    {
      code: 'const x = { fontWeight: 700 }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'fontWeight', token: 'fontWeight' },
        },
      ],
    },

    // Radius.
    {
      code: 'const x = { borderRadius: "4px" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'borderRadius', token: 'radius' },
        },
      ],
    },

    // Shadow.
    {
      code: 'const x = { boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'boxShadow', token: 'shadow' },
        },
      ],
    },

    // Motion — hard-coded duration.
    {
      code: 'const x = { transitionDuration: "120ms" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'transitionDuration', token: 'motion' },
        },
      ],
    },

    // Motion — hard-coded easing.
    {
      code: 'const x = { transitionTimingFunction: "ease-in-out" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'transitionTimingFunction', token: 'motion' },
        },
      ],
    },

    // Motion — hard-coded shorthand.
    {
      code: 'const x = { transition: "color 120ms ease-in-out" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'transition', token: 'motion' },
        },
      ],
    },

    // Motion — hard-coded animation duration.
    {
      code: 'const x = { animationDuration: "300ms" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'animationDuration', token: 'motion' },
        },
      ],
    },

    // Motion — hard-coded animation easing.
    {
      code: 'const x = { animationTimingFunction: "linear" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'animationTimingFunction', token: 'motion' },
        },
      ],
    },

    // Motion — hard-coded animation shorthand.
    {
      code: 'const x = { animation: "slide 300ms ease-in" }',
      errors: [
        {
          messageId: 'hardcoded' as const,
          data: { property: 'animation', token: 'motion' },
        },
      ],
    },

    // Redundant reset — padding.
    {
      code: 'const x = { padding: 0 }',
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'padding', value: '0' },
        },
      ],
    },

    // Redundant reset — margin string.
    {
      code: 'const x = { margin: "0px" }',
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'margin', value: '0px' },
        },
      ],
    },

    // Redundant reset — gap.
    {
      code: 'const x = { gap: 0 }',
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'gap', value: '0' },
        },
      ],
    },

    // Redundant reset — borderWidth.
    {
      code: 'const x = { borderWidth: "0" }',
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'borderWidth', value: '0' },
        },
      ],
    },

    // Redundant reset — `unset` is the same smell as `0`. The
    // post-reset default for padding/margin/gap/etc. is already 0;
    // restating it via `unset` is the author saying "set this to
    // whatever the reset already produced."
    {
      code: 'const x = { padding: "unset" }',
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'padding', value: 'unset' },
        },
      ],
    },

    {
      code: 'const x = { marginInline: "unset" }',
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'marginInline', value: 'unset' },
        },
      ],
    },

    // Specialization without a matching outer declaration is *still*
    // redundant — there's nothing local to override, so the inner value
    // is just restating the global reset.
    {
      code: "const x = { selectors: { '&:hover': { padding: 0 } } }",
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'padding', value: '0' },
        },
      ],
    },
    {
      code: "const x = { '@media': { '(min-width: 600px)': { padding: 0 } } }",
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'padding', value: '0' },
        },
      ],
    },
    // Sibling outer property of a *different* family doesn't count.
    {
      code: "const x = { color: c, selectors: { '&:hover': { padding: 0 } } }",
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'padding', value: '0' },
        },
      ],
    },
    // Two redundant resets next to each other don't mutually exempt.
    {
      code: "const x = { selectors: { '&:hover': { padding: 0, paddingTop: 0 } } }",
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'padding', value: '0' },
        },
        {
          messageId: 'redundantReset' as const,
          data: { property: 'paddingTop', value: '0' },
        },
      ],
    },

    // Variant boundary: a same-family property in a *sibling* variant
    // doesn't count as an override target — those classes don't share
    // state at runtime. styleVariants:
    {
      code: "const x = styleVariants({ primary: { padding: pad }, secondary: { selectors: { '&:hover': { padding: 0 } } } })",
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'padding', value: '0' },
        },
      ],
    },
    // Same boundary applies under recipe()'s variants record.
    {
      code: "const x = recipe({ variants: { size: { small: { padding: pad }, large: { selectors: { '&:hover': { padding: 0 } } } } } })",
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'padding', value: '0' },
        },
      ],
    },

    // Redundant full viewport — minHeight: 100dvh (the original case).
    {
      code: "const x = { minHeight: '100dvh' }",
      errors: [
        {
          messageId: 'redundantFullViewport' as const,
          data: { property: 'minHeight', value: '100dvh' },
        },
      ],
    },

    // Redundant full viewport — minHeight: 100vh.
    {
      code: "const x = { minHeight: '100vh' }",
      errors: [
        {
          messageId: 'redundantFullViewport' as const,
          data: { property: 'minHeight', value: '100vh' },
        },
      ],
    },

    // Redundant full viewport — minHeight: 100svh.
    {
      code: "const x = { minHeight: '100svh' }",
      errors: [
        {
          messageId: 'redundantFullViewport' as const,
          data: { property: 'minHeight', value: '100svh' },
        },
      ],
    },

    // Redundant full viewport — minHeight: 100lvh.
    {
      code: "const x = { minHeight: '100lvh' }",
      errors: [
        {
          messageId: 'redundantFullViewport' as const,
          data: { property: 'minHeight', value: '100lvh' },
        },
      ],
    },

    // Redundant full viewport — height: 100dvh.
    {
      code: "const x = { height: '100dvh' }",
      errors: [
        {
          messageId: 'redundantFullViewport' as const,
          data: { property: 'height', value: '100dvh' },
        },
      ],
    },

    // Redundant full viewport — height: 100vh.
    {
      code: "const x = { height: '100vh' }",
      errors: [
        {
          messageId: 'redundantFullViewport' as const,
          data: { property: 'height', value: '100vh' },
        },
      ],
    },

    // Redundant full viewport — array fallback (the canonical
    // vanilla-extract pattern the body reset uses). Flagging arrays
    // prevents this rule from being bypassed by restating the body's
    // exact shape in a descendant.
    {
      code: "const x = { minHeight: ['100vh', '100dvh'] }",
      errors: [
        {
          messageId: 'redundantFullViewport' as const,
          data: { property: 'minHeight', value: '100vh' },
        },
      ],
    },

    // Redundant full viewport — array fallback with only the new unit.
    {
      code: "const x = { height: ['50vh', '100dvh'] }",
      errors: [
        {
          messageId: 'redundantFullViewport' as const,
          data: { property: 'height', value: '100dvh' },
        },
      ],
    },
  ],
});

// Sanity: the mapping covers the expected groups.
describe('propertyToToken', () => {
  it.each([
    ['padding', 'space'],
    ['marginTop', 'space'],
    ['gap', 'space'],
    ['color', 'color'],
    ['backgroundColor', 'color'],
    ['fontSize', 'typeScale'],
    ['lineHeight', 'typeScale'],
    ['fontFamily', 'fontFamily'],
    ['fontWeight', 'fontWeight'],
    ['borderRadius', 'radius'],
    ['boxShadow', 'shadow'],
    ['transitionDuration', 'motion'],
    ['transitionTimingFunction', 'motion'],
    ['animationDuration', 'motion'],
    ['animationTimingFunction', 'motion'],
    ['transition', 'motion'],
    ['animation', 'motion'],
  ])('maps %s → %s', (prop, token) => {
    expect(propertyToToken.get(prop)).toBe(token);
  });
});
