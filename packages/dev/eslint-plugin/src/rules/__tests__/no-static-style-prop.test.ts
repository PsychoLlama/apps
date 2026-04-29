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

    // Redundant reset — padding.
    {
      code: '<div style={{ padding: 0 }} />',
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'padding', value: '0' },
        },
      ],
    },

    // Redundant reset — margin.
    {
      code: '<div style={{ margin: 0 }} />',
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'margin', value: '0' },
        },
      ],
    },

    // Redundant reset — string "0px".
    {
      code: '<div style={{ gap: "0px" }} />',
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'gap', value: '0px' },
        },
      ],
    },

    // Redundant reset — borderWidth.
    {
      code: '<div style={{ borderWidth: 0 }} />',
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'borderWidth', value: '0' },
        },
      ],
    },

    // Redundant reset — `unset` carries the same smell as `0`.
    {
      code: '<div style={{ padding: "unset" }} />',
      errors: [
        {
          messageId: 'redundantReset' as const,
          data: { property: 'padding', value: 'unset' },
        },
      ],
    },

    // Non-zero on a redundant-reset property is still static (not the special message).
    {
      code: '<div style={{ padding: 10 }} />',
      errors: [{ messageId: 'static' as const }],
    },

    // Zero on a non-reset property is static (not the special message).
    {
      code: '<div style={{ opacity: 0 }} />',
      errors: [{ messageId: 'static' as const }],
    },
  ],
});
