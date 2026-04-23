import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
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

  create(context) {
    return {
      CallExpression(node: Rule.Node) {
        const call = node as unknown as {
          callee: { type: string; name?: string };
          arguments: Array<{ type: string }>;
        };

        if (call.callee.type !== 'Identifier') return;
        if (call.callee.name !== 'defineEffect') return;

        const fn = call.arguments[1];
        if (!fn) return;

        // Only direct references are allowed — named capability or a
        // dotted path into a module namespace. Anything else (inline
        // function, bound call, ternary, etc.) is a structural no.
        if (fn.type === 'Identifier' || fn.type === 'MemberExpression') return;

        context.report({
          node: fn as unknown as Rule.Node,
          messageId: 'inline',
        });
      },
    };
  },
};

export default rule;
