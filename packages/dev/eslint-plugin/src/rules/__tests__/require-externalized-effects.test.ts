import { RuleTester } from 'eslint';
import rule from '../require-externalized-effects';

const tester = new RuleTester();

tester.run('require-externalized-effects', rule, {
  valid: [
    // Direct identifier reference — the canonical pattern.
    { code: 'defineEffect([], startRecording)' },
    { code: 'defineEffect([store], capability, { onSuccess })' },

    // Dotted reference into a capability module is also fine.
    { code: 'defineEffect([], capabilities.startRecording)' },
    { code: 'defineEffect([], mod.nested.fn)' },

    // Unrelated defineX calls are out of scope.
    { code: 'defineAction([store], (s) => { s.x = 1; })' },
    { code: 'defineStore(() => ({}))' },

    // Defensive — degenerate call shapes should not crash the rule.
    { code: 'defineEffect()' },
    { code: 'defineEffect([])' },
  ],

  invalid: [
    {
      code: 'defineEffect([], () => foo())',
      errors: [{ messageId: 'inline' as const }],
    },
    {
      code: 'defineEffect([store], async (s, input) => { await foo(input); })',
      errors: [{ messageId: 'inline' as const }],
    },
    {
      code: 'defineEffect([], function () { return foo(); })',
      errors: [{ messageId: 'inline' as const }],
    },

    // Thin alias wrappers are still flagged — pass the reference directly.
    {
      code: 'defineEffect([], (x) => foo(x))',
      errors: [{ messageId: 'inline' as const }],
    },

    // Bound / produced callables are call expressions, not references.
    {
      code: 'defineEffect([], foo.bind(null))',
      errors: [{ messageId: 'inline' as const }],
    },
    {
      code: 'defineEffect([], makeCallback())',
      errors: [{ messageId: 'inline' as const }],
    },

    // With handlers.
    {
      code: 'defineEffect([], () => foo(), { onSuccess })',
      errors: [{ messageId: 'inline' as const }],
    },
  ],
});
