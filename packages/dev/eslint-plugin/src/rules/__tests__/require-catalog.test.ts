import json from '@eslint/json';
import { RuleTester } from 'eslint';
import rule from '../require-catalog';

const tester = new RuleTester({
  plugins: { json },
  language: 'json/json',
});

const manifest = (deps: Record<string, unknown>) => JSON.stringify(deps);

tester.run('require-catalog', rule, {
  valid: [
    // Catalog and workspace protocols, including named catalogs.
    {
      code: manifest({
        dependencies: { a: 'catalog:', b: 'catalog:legacy' },
        devDependencies: { c: 'workspace:*' },
        optionalDependencies: { d: 'workspace:^' },
        peerDependencies: { e: 'catalog:' },
      }),
    },

    // Fields outside the dep buckets are ignored.
    { code: manifest({ name: '@lib/x', version: '1.0.0' }) },
    { code: manifest({ engines: { node: '>=22' } }) },
    { code: manifest({ pnpm: { overrides: { a: '^1.0.0' } } }) },

    // Nested objects that merely share a bucket name are ignored.
    { code: manifest({ config: { dependencies: { a: '^1.0.0' } } }) },

    // Non-object documents and buckets don't crash.
    { code: '[]' },
    { code: manifest({ dependencies: null }) },
  ],

  invalid: [
    {
      code: manifest({ dependencies: { a: '^1.0.0' } }),
      errors: [{ messageId: 'literalVersion' }],
    },
    {
      code: manifest({ devDependencies: { a: '1.2.3' } }),
      errors: [{ messageId: 'literalVersion' }],
    },
    {
      code: manifest({ optionalDependencies: { a: 'latest' } }),
      errors: [{ messageId: 'literalVersion' }],
    },
    {
      code: manifest({ peerDependencies: { a: '>=1' } }),
      errors: [{ messageId: 'literalVersion' }],
    },

    // Non-registry specifiers still need an explicit opt-out.
    {
      code: manifest({ dependencies: { a: 'github:owner/repo' } }),
      errors: [{ messageId: 'literalVersion' }],
    },

    // Every offender is reported, not just the first.
    {
      code: manifest({
        dependencies: { a: '^1.0.0', b: 'catalog:', c: '^2.0.0' },
      }),
      errors: [
        { messageId: 'literalVersion' },
        { messageId: 'literalVersion' },
      ],
    },
  ],
});
