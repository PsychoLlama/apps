import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../no-z-index';

const tester = new RuleTester();

tester.run('no-z-index', rule, {
  valid: [
    // Unrelated properties.
    { code: 'const x = { color: "red" }' },
    { code: 'const x = { position: "absolute" }' },
    { code: 'const x = { isolation: "isolate" }' },

    // Property names that merely contain "zIndex" as a substring don't count.
    { code: 'const x = { myZIndexHelper: 1 }' },

    // Computed keys we can't statically resolve are skipped.
    { code: 'const x = { [dynamic]: 1 }' },
  ],

  invalid: [
    // Identifier key — the canonical vanilla-extract form.
    {
      code: 'const x = { zIndex: 1 }',
      errors: [{ messageId: 'banned' as const }],
    },

    // Numeric values still trigger.
    {
      code: 'const x = { zIndex: 9999 }',
      errors: [{ messageId: 'banned' as const }],
    },

    // String values trigger.
    {
      code: 'const x = { zIndex: "auto" }',
      errors: [{ messageId: 'banned' as const }],
    },

    // String key form (rare, but valid in nested objects).
    {
      code: 'const x = { "z-index": 1 }',
      errors: [{ messageId: 'banned' as const }],
    },
    {
      code: 'const x = { "zIndex": 1 }',
      errors: [{ messageId: 'banned' as const }],
    },

    // Nested inside `selectors`, `@media`, etc. — same Property listener
    // catches them without any extra plumbing.
    {
      code: "const x = { selectors: { '&:hover': { zIndex: 1 } } }",
      errors: [{ messageId: 'banned' as const }],
    },
    {
      code: "const x = { '@media': { '(min-width: 600px)': { zIndex: 2 } } }",
      errors: [{ messageId: 'banned' as const }],
    },
  ],
});
