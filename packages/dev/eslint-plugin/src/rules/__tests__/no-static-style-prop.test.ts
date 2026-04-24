import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../no-static-style-prop';

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run('no-static-style-prop', rule, {
  valid: [
    // Dynamic values are fine.
    { code: '<div style={{ color: someVar() }} />' },
    { code: '<div style={{ width: props.width }} />' },
    { code: '<div style={{ transform: getTransform() }} />' },
    { code: '<div style={{ "--x": offset() }} />' },

    // Whole-object references are fine (assumed dynamic).
    { code: '<div style={dynamicStyles} />' },

    // Ternaries are dynamic (depend on a condition).
    { code: '<div style={{ color: active ? a : b }} />' },

    // Template literals with expressions are dynamic.
    { code: '<div style={{ width: `${w}px` }} />' },

    // Non-style props are irrelevant.
    { code: '<div class="foo" />' },
    { code: '<div data-x={42} />' },
  ],

  invalid: [
    // String literals are static.
    {
      code: '<div style={{ color: "red" }} />',
      errors: [{ messageId: 'static' as const }],
    },

    // Numeric literals are static.
    {
      code: '<div style={{ fontSize: 16 }} />',
      errors: [{ messageId: 'static' as const }],
    },

    // String with units is static.
    {
      code: '<div style={{ width: "100px" }} />',
      errors: [{ messageId: 'static' as const }],
    },

    // Mixed: only the static property is flagged.
    {
      code: '<div style={{ padding: "10px", color: someVar() }} />',
      errors: [{ messageId: 'static' as const }],
    },

    // Redundant zero — padding.
    {
      code: '<div style={{ padding: 0 }} />',
      errors: [
        { messageId: 'redundantZero' as const, data: { property: 'padding' } },
      ],
    },

    // Redundant zero — margin.
    {
      code: '<div style={{ margin: 0 }} />',
      errors: [
        { messageId: 'redundantZero' as const, data: { property: 'margin' } },
      ],
    },

    // Redundant zero — string "0px".
    {
      code: '<div style={{ gap: "0px" }} />',
      errors: [
        { messageId: 'redundantZero' as const, data: { property: 'gap' } },
      ],
    },

    // Redundant zero — borderWidth.
    {
      code: '<div style={{ borderWidth: 0 }} />',
      errors: [
        {
          messageId: 'redundantZero' as const,
          data: { property: 'borderWidth' },
        },
      ],
    },

    // Non-zero on a redundant-zero property is still static (not the special message).
    {
      code: '<div style={{ padding: 10 }} />',
      errors: [{ messageId: 'static' as const }],
    },

    // Zero on a non-redundant property is static (not the special message).
    {
      code: '<div style={{ opacity: 0 }} />',
      errors: [{ messageId: 'static' as const }],
    },
  ],
});
