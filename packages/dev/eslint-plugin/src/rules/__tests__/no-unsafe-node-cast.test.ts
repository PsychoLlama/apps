import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../no-unsafe-node-cast';

const tester = new RuleTester();

tester.run('no-unsafe-node-cast', rule, {
  valid: [
    // Plain single-step casts are fine — there are legitimate reasons to
    // lie to the type system (const-narrowing, opaque IDs, etc.).
    { code: "const x = value as 'red';" },
    { code: 'const n = input as number;' },

    // Rule listeners relying on contextual narrowing never need an escape.
    { code: 'const visit = (node: { type: string }) => node.type;' },

    // `as unknown` on its own is not flagged — only the double-cast pattern
    // that forges a shape through `unknown`.
    { code: 'const erased = value as unknown;' },
  ],

  invalid: [
    // The canonical escape hatch — forging a listener node shape.
    {
      code: 'const x = node as unknown as { name: string };',
      errors: [{ messageId: 'doubleCast' }],
    },

    // Via a named type alias.
    {
      code: 'type Shape = { name: string }; const x = node as unknown as Shape;',
      errors: [{ messageId: 'doubleCast' }],
    },

    // Nested inside a member expression — same smell.
    {
      code: 'const name = (node as unknown as { name: string }).name;',
      errors: [{ messageId: 'doubleCast' }],
    },
  ],
});
