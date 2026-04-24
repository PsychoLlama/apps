import { RuleTester } from 'eslint';
import rule from '../require-explicit-route-export';

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
});

tester.run('require-explicit-route-export', rule, {
  valid: [
    // Canonical pattern — literal `import` and `export default` substrings
    // keep SolidStart's detector happy.
    {
      code: "import NotFound from '../not-found/not-found';\nexport default NotFound;",
    },
    // Inline default export has the literal substring too.
    { code: 'export default function Route() { return null; }' },

    // Non-default re-exports are fine — route files only need a default.
    { code: "export { foo, bar } from './lib';" },
    { code: "export { foo as baz } from './lib';" },

    // Wildcard re-exports are out of scope. They are rare in route files
    // and the right rewrite isn't obvious.
    { code: "export * from './lib';" },

    // Local exports with no source module.
    { code: 'const value = 1; export { value };' },
  ],

  invalid: [
    // The canonical footgun.
    {
      code: "export { default } from '../not-found/not-found';",
      errors: [{ messageId: 'reexport' as const }],
    },
    // Aliased re-export — same structural issue.
    {
      code: "export { Button as default } from '../components/button';",
      errors: [{ messageId: 'reexport' as const }],
    },
    // Mixed specifiers — the `default` slot is still the problem.
    {
      code: "export { default, Helper } from '../foo';",
      errors: [{ messageId: 'reexport' as const }],
    },
  ],
});
