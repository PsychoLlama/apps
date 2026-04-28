import {
  AST_NODE_TYPES,
  ASTUtils,
  ESLintUtils,
  TSESLint,
} from '@typescript-eslint/utils';

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
    return {
      TSTypeOperator(node) {
        if (node.operator !== 'keyof') return;
        if (node.typeAnnotation?.type !== AST_NODE_TYPES.TSTypeQuery) return;

        const { exprName } = node.typeAnnotation;
        if (exprName.type !== AST_NODE_TYPES.Identifier) return;

        // Resolve the identifier through scope so a closer binding (a
        // parameter, inner `const`, etc.) shadowing the import wins. The
        // file-level import name is not enough on its own.
        const scope = context.sourceCode.getScope(node);
        const variable = ASTUtils.findVariable(scope, exprName.name);
        if (!variable) return;

        const def = variable.defs[0];
        if (!def || def.type !== TSESLint.Scope.DefinitionType.ImportBinding)
          return;
        if (def.parent?.type !== AST_NODE_TYPES.ImportDeclaration) return;
        if (def.parent.source.value !== '@lib/design') return;
        if (def.node.type !== AST_NODE_TYPES.ImportSpecifier) return;
        if (def.node.imported.type !== AST_NODE_TYPES.Identifier) return;

        const importedName = def.node.imported.name;
        if (!(importedName in tokenToType)) return;

        const canonical = importedName as keyof typeof tokenToType;

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
