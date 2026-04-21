import type { Rule } from 'eslint';

const components = new Set(['Text', 'Heading']);

interface JSXChild {
  type: string;
}

interface JSXAttribute {
  type: string;
  name: { type: string; name: string };
}

interface JSXOpeningElement {
  name: { type: string; name: string };
  attributes: JSXAttribute[];
}

const hasDynamicChildren = (children: JSXChild[]): boolean => {
  return children.some((child) => child.type === 'JSXExpressionContainer');
};

const hasSelectableProp = (attributes: JSXAttribute[]): boolean => {
  return attributes.some(
    (attr) => attr.type === 'JSXAttribute' && attr.name.name === 'selectable',
  );
};

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require an explicit selectable prop on Text/Heading when children are dynamic.',
    },
    messages: {
      missing:
        'Dynamic content requires an explicit `selectable` prop. ' +
        'Set selectable={true} for user-generated or data-driven content ' +
        '(e.g. chat messages, reviews, prices), or selectable={false} for ' +
        'app chrome rendered from variables (e.g. computed labels, counts).',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXElement(node: Rule.Node) {
        const element = node as unknown as {
          openingElement: JSXOpeningElement;
          children: JSXChild[];
        };

        const { openingElement, children } = element;
        if (openingElement.name.type !== 'JSXIdentifier') return;
        if (!components.has(openingElement.name.name)) return;
        if (!hasDynamicChildren(children)) return;
        if (hasSelectableProp(openingElement.attributes)) return;

        context.report({
          node: node,
          messageId: 'missing',
        });
      },
    };
  },
};

export default rule;
