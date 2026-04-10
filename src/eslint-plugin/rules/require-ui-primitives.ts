import type { Rule } from 'eslint';

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
  'p',
  'label',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]);

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ban raw HTML elements that have a #ui component equivalent.',
    },
    messages: {
      banned: 'Use a #ui primitive instead of <{{element}}>.',
    },
    schema: [],
  },

  create(context) {
    return {
      JSXOpeningElement(node: Rule.Node) {
        const name = (
          node as unknown as { name: { type: string; name: string } }
        ).name;
        if (name.type !== 'JSXIdentifier') return;
        if (!bannedElements.has(name.name as HtmlTag)) return;

        context.report({
          node,
          messageId: 'banned',
          data: { element: name.name },
        });
      },
    };
  },
};

export default rule;
