import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from '@typescript-eslint/utils';

/**
 * Bans `!important` in vanilla-extract style values. Vanilla-extract
 * has no first-class `!important` flag, so the only way to declare it
 * is to suffix a string value (`color: 'red !important'`). We catch
 * those — including string fallback arrays and template-literal
 * quasis — anywhere a property value contains the text.
 *
 * `!important` starts a cascade arms race. We own every selector in
 * the codebase, so a losing rule is always solvable by raising
 * specificity legitimately or fixing the conflicting selector. If a
 * genuine UA-only edge case ever needs it, use a one-off
 * `eslint-disable` with a `--` rationale.
 */
const IMPORTANT_RE = /!\s*important\b/i;

const containsImportant = (node: TSESTree.Node): boolean => {
  if (
    node.type === AST_NODE_TYPES.Literal &&
    typeof node.value === 'string' &&
    IMPORTANT_RE.test(node.value)
  ) {
    return true;
  }

  if (node.type === AST_NODE_TYPES.TemplateLiteral) {
    return node.quasis.some((quasi) =>
      IMPORTANT_RE.test(quasi.value.cooked ?? quasi.value.raw),
    );
  }

  // Fallback arrays (`padding: ['10px', 'var(--x)']`) are vanilla-extract's
  // browser-fallback syntax. Any element could carry `!important`, so we
  // recurse rather than only checking literals.
  if (node.type === AST_NODE_TYPES.ArrayExpression) {
    return node.elements.some(
      (element) => element !== null && containsImportant(element),
    );
  }

  return false;
};

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const rule = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban `!important` in vanilla-extract styles. Fix the source of the cascade conflict, not the symptom.',
    },
    messages: {
      banned:
        '`!important` is banned. We control every selector — raise specificity legitimately or fix the conflicting rule. `!important` starts an arms race that compounds across the codebase.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Property(node) {
        if (!containsImportant(node.value)) return;
        context.report({ node, messageId: 'banned' });
      },
    };
  },
});

export default rule;
