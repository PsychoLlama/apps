import {
  AST_NODE_TYPES,
  ASTUtils,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';

/**
 * Steers bare `if (…) throw new Error(…)` guards toward `assert` from
 * `@lib/assert`. The guard and the throw are the same statement there, so
 * the invariant reads as one line instead of three, and the failure lands
 * as an `AssertionError` — which marks it a bug rather than a condition a
 * caller could legitimately hit.
 *
 * Only the plainest shape is reported, because that shape is the one
 * `assert` replaces without losing anything:
 *
 * - The thrown class is the global `Error`. A named subclass (or a refined
 *   built-in like `TypeError`) is a handling contract — something
 *   downstream may catch it, or a host may dispatch on it — and `assert`
 *   collapses that identity. A shadowed local `Error` is left alone too.
 * - The body is nothing but the throw. Setup statements before it mean the
 *   author is assembling a report from runtime state, which is a diagnosis
 *   of a real failure rather than a note on a broken invariant.
 * - There's no `else`, and the guard isn't the tail of an `else if` chain.
 *   Both are branches, not preconditions, and neither lifts to a call.
 *
 * The message shape is deliberately not judged: an invariant is free to
 * interpolate the value that broke it.
 */
const REPORTABLE_ERROR = 'Error';

// Unwrap `if (c) throw x;` and `if (c) { throw x; }` alike. A block holding
// anything besides the throw bails — comments don't count, since they carry
// no runtime setup.
const soleThrow = (
  body: TSESTree.Statement,
): TSESTree.ThrowStatement | null => {
  if (body.type === AST_NODE_TYPES.ThrowStatement) return body;
  if (body.type !== AST_NODE_TYPES.BlockStatement) return null;
  if (body.body.length !== 1) return null;

  const [only] = body.body;
  return only?.type === AST_NODE_TYPES.ThrowStatement ? only : null;
};

// True only for the ambient `Error`. A binding with declarations of its own
// is a local shadow, and constructing it says nothing about the global.
const isGlobalError = (
  callee: TSESTree.Identifier,
  scope: TSESLint.Scope.Scope,
): boolean => {
  const variable = ASTUtils.findVariable(scope, callee);
  return variable === null || variable.defs.length === 0;
};

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const rule = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer `assert` from `@lib/assert` over a bare `if (…) throw new Error(…)` invariant guard.',
    },
    messages: {
      preferAssert:
        'Use `assert` from `@lib/assert` for this invariant — it states the condition and the message in one line, and `AssertionError` marks the failure as a bug. If a caller is meant to detect this failure, throw a named `Error` subclass instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      IfStatement(node) {
        if (node.alternate !== null) return;

        // An `else if` tail is a branch in a chain. Hoisting it to a call
        // would run the check unconditionally.
        if (node.parent.type === AST_NODE_TYPES.IfStatement) {
          if (node.parent.alternate === node) return;
        }

        const thrown = soleThrow(node.consequent);
        if (thrown === null) return;

        const { argument } = thrown;
        if (argument.type !== AST_NODE_TYPES.NewExpression) return;
        if (argument.callee.type !== AST_NODE_TYPES.Identifier) return;
        if (argument.callee.name !== REPORTABLE_ERROR) return;

        const scope = context.sourceCode.getScope(node);
        if (!isGlobalError(argument.callee, scope)) return;

        context.report({ node, messageId: 'preferAssert' });
      },
    };
  },
});

export default rule;
