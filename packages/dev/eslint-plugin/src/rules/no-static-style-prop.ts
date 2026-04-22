import type { Rule } from 'eslint';
import { getPropertyName } from '../utils/ast';
import {
  isZeroValue,
  redundantZeroMessage,
  redundantZeroProperties,
} from '../utils/redundant-css';

interface JSXProperty {
  type: string;
  key: { type: string; name?: string; value?: string };
  value: { type: string; value?: unknown };
}

interface JSXAttribute {
  name: { name: string };
  value?: {
    type: string;
    expression: {
      type: string;
      properties: JSXProperty[];
    };
  };
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ban static values in JSX style props. Static styles belong in vanilla-extract.',
    },
    messages: {
      static:
        'Static styles belong in vanilla-extract. Only use the style prop for dynamic runtime values.',
      redundantZero: redundantZeroMessage,
    },
    schema: [],
  },

  create(context) {
    return {
      JSXAttribute(node: Rule.Node) {
        const attr = node as unknown as JSXAttribute;
        if (attr.name.name !== 'style') return;
        if (attr.value?.type !== 'JSXExpressionContainer') return;

        const expr = attr.value.expression;
        if (expr.type !== 'ObjectExpression') return;

        for (const prop of expr.properties) {
          if (prop.type !== 'Property') continue;
          if (prop.value.type !== 'Literal') continue;

          const name = getPropertyName(prop.key);

          if (
            name &&
            redundantZeroProperties.has(name) &&
            isZeroValue(prop.value.value)
          ) {
            context.report({
              node: prop as unknown as Rule.Node,
              messageId: 'redundantZero',
              data: { property: name },
            });
            continue;
          }

          context.report({
            node: prop as unknown as Rule.Node,
            messageId: 'static',
          });
        }
      },
    };
  },
};

export default rule;
