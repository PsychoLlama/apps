import type { JSONRuleDefinition } from '@eslint/json';

/**
 * Requires every `package.json` dependency to use `catalog:` or
 * `workspace:`. Literal ranges bypass the catalog and let versions drift
 * between packages, even for deps used in only one place today.
 *
 * Only the prefix is checked. pnpm already fails install when a
 * `catalog:` reference has no matching entry, so the rule never needs to
 * read `pnpm-workspace.yaml`.
 *
 * Specifiers a catalog can't express (`git:`, `file:`, tarball URLs) need
 * a one-off `eslint-disable` with a `--` rationale.
 */
const DEP_BUCKETS = new Set([
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]);

const ALLOWED_PROTOCOLS = ['catalog:', 'workspace:'];

const rule: JSONRuleDefinition<{ MessageIds: 'literalVersion' }> = {
  meta: {
    type: 'problem',
    languages: ['json/json'],
    docs: {
      description:
        'Require `catalog:` or `workspace:` for every dependency in `package.json`.',
    },
    messages: {
      literalVersion:
        '`{{name}}: {{version}}` bypasses the catalog. Add it to `catalog:` in `pnpm-workspace.yaml` and reference it as `catalog:`.',
    },
    schema: [],
  },
  create(context) {
    return {
      Document(document) {
        if (document.body.type !== 'Object') return;

        for (const bucket of document.body.members) {
          if (bucket.name.type !== 'String') continue;
          if (!DEP_BUCKETS.has(bucket.name.value)) continue;
          if (bucket.value.type !== 'Object') continue;

          for (const dep of bucket.value.members) {
            if (dep.name.type !== 'String') continue;
            if (dep.value.type !== 'String') continue;

            const version = dep.value.value;
            if (ALLOWED_PROTOCOLS.some((proto) => version.startsWith(proto))) {
              continue;
            }

            context.report({
              loc: dep.value.loc,
              messageId: 'literalVersion',
              data: { name: dep.name.value, version },
            });
          }
        }
      },
    };
  },
};

export default rule;
