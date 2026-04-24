import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from '@typescript-eslint/utils';

const components = new Set(['Text', 'Heading']);

const hasDynamicChildren = (
  children: readonly TSESTree.JSXChild[],
): boolean => {
  return children.some(
    (child) => child.type === AST_NODE_TYPES.JSXExpressionContainer,
  );
};

const hasSelectableProp = (
  attributes: readonly (TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute)[],
): boolean => {
  return attributes.some(
    (attr) =>
      attr.type === AST_NODE_TYPES.JSXAttribute &&
      attr.name.type === AST_NODE_TYPES.JSXIdentifier &&
      attr.name.name === 'selectable',
  );
};

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const rule = createRule({
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
  defaultOptions: [],
  create(context) {
    return {
      JSXElement(node) {
        const { openingElement, children } = node;
        if (openingElement.name.type !== AST_NODE_TYPES.JSXIdentifier) return;
        if (!components.has(openingElement.name.name)) return;
        if (!hasDynamicChildren(children)) return;
        if (hasSelectableProp(openingElement.attributes)) return;

        context.report({ node, messageId: 'missing' });
      },
    };
  },
});

export default rule;
