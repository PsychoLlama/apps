import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';

type HtmlTag = keyof HTMLElementTagNameMap;

export const bannedElements = new Set<HtmlTag>([
  'div',
  'span',
  'nav',
  'main',
  'section',
  'aside',
  'header',
  'footer',
  'article',
  'figure',
  'figcaption',
  'details',
  'summary',
  'fieldset',
  'form',
  'ol',
  'ul',
  'li',
  'a',
  'button',
  'p',
  'label',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]);

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const rule = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ban raw HTML elements that have a @lib/ui component equivalent.',
    },
    messages: {
      banned: 'Use a @lib/ui primitive instead of <{{element}}>.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== AST_NODE_TYPES.JSXIdentifier) return;
        if (!bannedElements.has(node.name.name as HtmlTag)) return;

        context.report({
          node,
          messageId: 'banned',
          data: { element: node.name.name },
        });
      },
    };
  },
});

export default rule;
