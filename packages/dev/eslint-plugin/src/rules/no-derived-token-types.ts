import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

/**
 * Design tokens that already publish a `keyof`-equivalent type alias from
 * `@lib/design`. Keys are the value identifiers; values are the matching
 * type aliases the rule redirects callers toward.
 */
const tokenToType = {
  space: 'SpaceScale',
  radius: 'RadiusScale',
  shadow: 'ShadowLevel',
  fontWeight: 'FontWeight',
  typeScale: 'TypeScale',
  text: 'TextColor',
  background: 'BackgroundColor',
} as const satisfies Record<string, string>;

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const rule = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Use the exported type alias for a design token instead of `keyof typeof`. @lib/design already ships these aliases — re-deriving them is redundant and drifts when token shapes change.',
    },
    messages: {
      useExportedType:
        '`keyof typeof {{token}}` duplicates the `{{type}}` alias exported from @lib/design. Import and use `{{type}}` instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    /** Local-binding name → canonical token name (handles `import { space as s }`). */
    const tokenLocals = new Map<string, keyof typeof tokenToType>();

    return {
      ImportDeclaration(node) {
        if (node.source.value !== '@lib/design') return;

        for (const specifier of node.specifiers) {
          if (specifier.type !== AST_NODE_TYPES.ImportSpecifier) continue;
          if (specifier.imported.type !== AST_NODE_TYPES.Identifier) continue;

          const importedName = specifier.imported.name;
          if (importedName in tokenToType) {
            tokenLocals.set(
              specifier.local.name,
              importedName as keyof typeof tokenToType,
            );
          }
        }
      },

      TSTypeOperator(node) {
        if (node.operator !== 'keyof') return;
        if (node.typeAnnotation?.type !== AST_NODE_TYPES.TSTypeQuery) return;

        const { exprName } = node.typeAnnotation;
        if (exprName.type !== AST_NODE_TYPES.Identifier) return;

        const canonical = tokenLocals.get(exprName.name);
        if (!canonical) return;

        context.report({
          node,
          messageId: 'useExportedType',
          data: { token: canonical, type: tokenToType[canonical] },
        });
      },
    };
  },
});

export default rule;
