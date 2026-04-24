import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

// ESLint's rule types give you a typed `node` parameter on every visitor
// key (see `TSESTree.NodeListener`). The canonical way to handle a union
// is to branch on `node.type` — TypeScript narrows the rest of the node
// for you. Reaching for `x as unknown as {...}` to forge a shape is an
// admission that the narrow path was skipped — usually because the author
// annotated the parameter as `Rule.Node` themselves and overrode the
// contextual type. Drop the annotation, lean on the listener key, and
// the cast becomes unnecessary.

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const rule = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid `as unknown as ...` double casts inside ESLint rule files. Use the typed listener node parameter and narrow with `node.type` checks instead.',
    },
    messages: {
      doubleCast:
        'Avoid `as unknown as …`. ESLint rule listeners already type `node` from the visitor key — branch on `node.type` to narrow instead of forging a shape through `unknown`.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      TSAsExpression(node) {
        if (node.expression.type !== AST_NODE_TYPES.TSAsExpression) return;
        if (
          node.expression.typeAnnotation.type !==
          AST_NODE_TYPES.TSUnknownKeyword
        ) {
          return;
        }

        context.report({ node, messageId: 'doubleCast' });
      },
    };
  },
});

export default rule;
