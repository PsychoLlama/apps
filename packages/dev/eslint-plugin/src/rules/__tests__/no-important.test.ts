import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../no-important';

const tester = new RuleTester();

tester.run('no-important', rule, {
  valid: [
    // Unrelated values.
    { code: 'const x = { color: "red" }' },
    { code: 'const x = { padding: "10px 20px" }' },
    { code: 'const x = { transition: "color 0.3s ease" }' },

    // Identifier and member values pass through untouched.
    { code: 'const x = { color: accent[9] }' },
    { code: 'const x = { padding: someVar }' },

    // Template literal without `!important`.
    { code: 'const x = { transition: `color ${fast[1]}` }' },

    // Fallback array without `!important`.
    { code: "const x = { minHeight: ['100vh', '100dvh'] }" },

    // The word "important" alone is fine — only `!important` is banned.
    { code: 'const x = { content: "important notice" }' },
    { code: 'const x = { content: "this is important" }' },
  ],

  invalid: [
    // Plain string literal.
    {
      code: 'const x = { color: "red !important" }',
      errors: [{ messageId: 'banned' as const }],
    },

    // Whitespace tolerance — match `! important`, `!  important`, etc.
    {
      code: 'const x = { color: "red ! important" }',
      errors: [{ messageId: 'banned' as const }],
    },

    // Case-insensitive.
    {
      code: 'const x = { color: "red !IMPORTANT" }',
      errors: [{ messageId: 'banned' as const }],
    },

    // Template literal with `!important` in a quasi.
    {
      code: 'const x = { color: `${accent[9]} !important` }',
      errors: [{ messageId: 'banned' as const }],
    },

    // Fallback array with `!important` in any element.
    {
      code: "const x = { color: ['red', 'blue !important'] }",
      errors: [{ messageId: 'banned' as const }],
    },

    // Nested in `selectors` / `@media` — single Property listener covers it.
    {
      code: "const x = { selectors: { '&:hover': { color: 'red !important' } } }",
      errors: [{ messageId: 'banned' as const }],
    },
    {
      code: "const x = { '@media': { '(min-width: 600px)': { color: 'red !important' } } }",
      errors: [{ messageId: 'banned' as const }],
    },
  ],
});
