import {
  AST_NODE_TYPES,
  ESLintUtils,
  type TSESTree,
} from '@typescript-eslint/utils';

/**
 * Bans interpolating template literals in `@lib/observability` log
 * calls. Dynamic data belongs in the structured context argument, not
 * baked into the message. A stable message string is what makes logs
 * groupable, searchable, and filterable downstream.
 *
 * Tracks `createLogger` imported from `@lib/observability`, the locals
 * bound to its return value, and any `.namespace(...)` chains derived
 * from them. Reports `.<level>(`...${x}...`)` calls on that lineage.
 * Plain identifier or non-interpolating string messages are allowed.
 */
const LOG_LEVELS: ReadonlySet<string> = new Set([
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
]);

const OBSERVABILITY_PACKAGE = '@lib/observability';
const CREATE_LOGGER = 'createLogger';
const NAMESPACE_METHOD = 'namespace';

// Walk a chained MemberExpression/CallExpression down to the leftmost
// identifier. `logger.namespace('x').namespace('y')` resolves to
// `logger`; bail to `null` on anything else (string literals,
// computed access, parenthesised expressions we don't unwrap, etc).
const rootIdentifier = (node: TSESTree.Node): TSESTree.Identifier | null => {
  let cursor: TSESTree.Node = node;
  while (true) {
    if (cursor.type === AST_NODE_TYPES.Identifier) return cursor;
    if (cursor.type === AST_NODE_TYPES.CallExpression) {
      cursor = cursor.callee;
      continue;
    }
    if (cursor.type === AST_NODE_TYPES.MemberExpression) {
      cursor = cursor.object;
      continue;
    }
    return null;
  }
};

const isCreateLoggerCall = (
  node: TSESTree.Node,
  createLoggerLocals: ReadonlySet<string>,
): boolean => {
  if (node.type !== AST_NODE_TYPES.CallExpression) return false;
  if (node.callee.type !== AST_NODE_TYPES.Identifier) return false;
  return createLoggerLocals.has(node.callee.name);
};

const isNamespaceCallOnLogger = (
  node: TSESTree.Node,
  loggerLocals: ReadonlySet<string>,
): boolean => {
  if (node.type !== AST_NODE_TYPES.CallExpression) return false;
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return false;
  if (node.callee.property.type !== AST_NODE_TYPES.Identifier) return false;
  if (node.callee.property.name !== NAMESPACE_METHOD) return false;
  const root = rootIdentifier(node.callee.object);
  return root !== null && loggerLocals.has(root.name);
};

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const rule = createRule({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban interpolating template literals in `@lib/observability` log calls. Move dynamic data into the structured context argument.',
    },
    messages: {
      interpolated:
        'Move `${...}` values into the log context argument. The message string should be a constant so logs stay groupable and filterable on attributes.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const createLoggerLocals = new Set<string>();
    const loggerLocals = new Set<string>();
    const callsToCheck: TSESTree.CallExpression[] = [];

    return {
      ImportDeclaration(node) {
        if (node.source.value !== OBSERVABILITY_PACKAGE) return;
        for (const spec of node.specifiers) {
          if (spec.type !== AST_NODE_TYPES.ImportSpecifier) continue;
          if (spec.imported.type !== AST_NODE_TYPES.Identifier) continue;
          if (spec.imported.name !== CREATE_LOGGER) continue;
          createLoggerLocals.add(spec.local.name);
        }
      },

      VariableDeclarator(node) {
        if (!node.init) return;
        if (node.id.type !== AST_NODE_TYPES.Identifier) return;

        if (
          isCreateLoggerCall(node.init, createLoggerLocals) ||
          isNamespaceCallOnLogger(node.init, loggerLocals)
        ) {
          loggerLocals.add(node.id.name);
        }
      },

      // Collect during the walk and validate on exit so logger calls
      // appearing earlier in the file than their binding still resolve.
      CallExpression(node) {
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) return;
        if (node.callee.property.type !== AST_NODE_TYPES.Identifier) return;
        if (!LOG_LEVELS.has(node.callee.property.name)) return;
        callsToCheck.push(node);
      },

      'Program:exit'() {
        for (const node of callsToCheck) {
          if (node.callee.type !== AST_NODE_TYPES.MemberExpression) continue;
          const root = rootIdentifier(node.callee.object);
          if (!root || !loggerLocals.has(root.name)) continue;

          const first = node.arguments[0];
          if (!first) continue;
          if (first.type !== AST_NODE_TYPES.TemplateLiteral) continue;
          if (first.expressions.length === 0) continue;

          context.report({ node: first, messageId: 'interpolated' });
        }
      },
    };
  },
});

export default rule;
