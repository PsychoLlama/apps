import { ESLintUtils } from '@typescript-eslint/utils';
import { getPropertyName } from '../utils/ast';

/**
 * Bans `zIndex` (and `'z-index'`) declarations in vanilla-extract style
 * objects. Once any `z-index` enters the codebase, every later author
 * has to pick a number relative to the existing ones — the values
 * compound and you can't remove one without auditing the whole tree.
 * There is no legitimate use for `z-index` in this codebase.
 */
const createRule = ESLintUtils.RuleCreator.withoutDocs;

const rule = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban `z-index` declarations. Stacking-context values compound and cannot be removed without auditing every other rule in the codebase.',
    },
    messages: {
      banned:
        '`z-index` is banned. Every value compounds the stacking-context graph and cannot be removed without auditing every other rule in the codebase.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Property(node) {
        const name = getPropertyName(node.key);
        if (name !== 'zIndex' && name !== 'z-index') return;
        context.report({ node, messageId: 'banned' });
      },
    };
  },
});

export default rule;
