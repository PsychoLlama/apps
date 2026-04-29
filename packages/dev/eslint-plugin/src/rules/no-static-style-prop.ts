import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import { getPropertyName } from '../utils/ast';
import {
  isRedundantResetValue,
  redundantResetMessage,
  redundantResetProperties,
} from '../utils/redundant-css';

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const rule = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ban static values in JSX style props. Static styles belong in vanilla-extract.',
    },
    messages: {
      static:
        'Static styles belong in vanilla-extract. Only use the style prop for dynamic runtime values.',
      redundantReset: redundantResetMessage,
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== AST_NODE_TYPES.JSXIdentifier) return;
        if (node.name.name !== 'style') return;
        if (node.value?.type !== AST_NODE_TYPES.JSXExpressionContainer) return;

        const expr = node.value.expression;
        if (expr.type !== AST_NODE_TYPES.ObjectExpression) return;

        for (const prop of expr.properties) {
          if (prop.type !== AST_NODE_TYPES.Property) continue;
          if (prop.value.type !== AST_NODE_TYPES.Literal) continue;

          const name = getPropertyName(prop.key);
          const value = prop.value.value;

          if (
            name &&
            redundantResetProperties.has(name) &&
            isRedundantResetValue(name, value)
          ) {
            context.report({
              node: prop,
              messageId: 'redundantReset',
              data: { property: name, value: String(value) },
            });
            continue;
          }

          context.report({ node: prop, messageId: 'static' });
        }
      },
    };
  },
});

export default rule;
