import { RuleTester } from 'eslint';
import rule, { propertyToToken } from '../require-design-tokens';

const tester = new RuleTester();

tester.run('require-design-tokens', rule as never, {
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

    // Redundant zero — padding.
    {
      code: 'const x = { padding: 0 }',
      errors: [
        {
          messageId: 'redundantZero' as const,
          data: { property: 'padding' },
        },
      ],
    },

    // Redundant zero — margin string.
    {
      code: 'const x = { margin: "0px" }',
      errors: [
        {
          messageId: 'redundantZero' as const,
          data: { property: 'margin' },
        },
      ],
    },

    // Redundant zero — gap.
    {
      code: 'const x = { gap: 0 }',
      errors: [
        { messageId: 'redundantZero' as const, data: { property: 'gap' } },
      ],
    },

    // Redundant zero — borderWidth.
    {
      code: 'const x = { borderWidth: "0" }',
      errors: [
        {
          messageId: 'redundantZero' as const,
          data: { property: 'borderWidth' },
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
  ])('maps %s → %s', (prop, token) => {
    expect(propertyToToken.get(prop)).toBe(token);
  });
});
