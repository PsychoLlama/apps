import {
  AST_TOKEN_TYPES,
  ESLintUtils,
  type TSESTree,
} from '@typescript-eslint/utils';

/**
 * Requires a blank line between a comment and the sibling that precedes
 * it in a member list:
 *
 * ```ts
 * interface Props {
 *   src?: string;
 *
 *   // Required even when `src` is undefined.
 *   alt: string;
 * }
 * ```
 *
 * Prettier has the final say on blank lines, so the rule only checks
 * lists where prettier preserves a blank line between siblings:
 * statements, class/interface/type/object/enum members, array and tuple
 * elements, and switch cases. Everything else (type parameters,
 * ternary branches, member chains, ...) is ignored outright rather than
 * guessed at.
 *
 * Comments that open a list are exempt (prettier strips the blank line
 * after `{`), as are comments continuing a comment block and trailing
 * comments that share a line with code.
 */
const createRule = ESLintUtils.RuleCreator.withoutDocs;

type Comment = TSESTree.Comment;
type Token = TSESTree.Token;

const rule = createRule({
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: {
      description:
        'Require a blank line between a comment and the preceding sibling in a member list.',
    },
    messages: {
      missing: 'Add a blank line before this comment.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    const isComment = (token: Token): token is Comment =>
      token.type === AST_TOKEN_TYPES.Line ||
      token.type === AST_TOKEN_TYPES.Block;

    /** True if nothing but whitespace precedes the comment on its line. */
    const startsOwnLine = (comment: Comment): boolean => {
      const prev = sourceCode.getTokenBefore(comment, {
        includeComments: true,
      });

      return !prev || prev.loc.end.line < comment.loc.start.line;
    };

    const check = (comment: Comment) => {
      if (!startsOwnLine(comment)) return;

      const prev = sourceCode.getTokenBefore(comment, {
        includeComments: true,
      });

      if (!prev || prev.loc.end.line !== comment.loc.start.line - 1) return;

      // Continuation of a comment block that already got its blank line.
      if (isComment(prev) && startsOwnLine(prev)) return;

      context.report({
        loc: comment.loc,
        messageId: 'missing',
        fix: (fixer) => {
          const lineStart = comment.range[0] - comment.loc.start.column;
          return fixer.insertTextBeforeRange([lineStart, lineStart], '\n');
        },
      });
    };

    /**
     * Checks comments sitting between siblings, and (when the list has a
     * closing token) after the last sibling. Comments before the first
     * sibling are left alone.
     */
    const checkList = (
      items: readonly (TSESTree.Node | null)[],
      closing?: Token | null,
    ) => {
      const nodes = items.filter((item) => item !== null);

      nodes.slice(1).forEach((node) => {
        sourceCode.getCommentsBefore(node).forEach(check);
      });

      const last = nodes.at(-1);
      if (last && closing) {
        sourceCode
          .getCommentsBefore(closing)
          .filter((comment) => comment.range[0] >= last.range[1])
          .forEach(check);
      }
    };

    const closingOf = (node: TSESTree.Node) => sourceCode.getLastToken(node);

    return {
      Program: (node) => checkList(node.body),
      BlockStatement: (node) => checkList(node.body, closingOf(node)),
      StaticBlock: (node) => checkList(node.body, closingOf(node)),
      TSModuleBlock: (node) => checkList(node.body, closingOf(node)),
      SwitchStatement: (node) => checkList(node.cases, closingOf(node)),
      SwitchCase: (node) => checkList(node.consequent),
      ClassBody: (node) => checkList(node.body, closingOf(node)),
      TSInterfaceBody: (node) => checkList(node.body, closingOf(node)),
      TSTypeLiteral: (node) => checkList(node.members, closingOf(node)),
      TSEnumBody: (node) => checkList(node.members, closingOf(node)),
      ObjectExpression: (node) => checkList(node.properties, closingOf(node)),
      ArrayExpression: (node) => checkList(node.elements, closingOf(node)),
      TSTupleType: (node) => checkList(node.elementTypes, closingOf(node)),
    };
  },
});

export default rule;
