import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const rule = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require defineEffect callbacks to be external references so side effects stay separable from their state bindings.',
    },
    messages: {
      inline:
        'Move this callback into a capability module and pass it to defineEffect by reference. Side effects should live outside their state binding.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.Identifier) return;
        if (node.callee.name !== 'defineEffect') return;

        const fn = node.arguments[1];
        if (!fn) return;

        // Only direct references are allowed — named capability or a
        // dotted path into a module namespace. Anything else (inline
        // function, bound call, ternary, etc.) is a structural no.
        if (
          fn.type === AST_NODE_TYPES.Identifier ||
          fn.type === AST_NODE_TYPES.MemberExpression
        ) {
          return;
        }

        context.report({ node: fn, messageId: 'inline' });
      },
    };
  },
});

export default rule;
