import {
  AST_NODE_TYPES,
  ASTUtils,
  ESLintUtils,
  TSESLint,
  type TSESTree,
} from '@typescript-eslint/utils';

const ICON_IMPORT_PREFIX = 'virtual:icons/';
const UI_IMPORT_SOURCE = '@lib/ui';

const createRule = ESLintUtils.RuleCreator.withoutDocs;

/**
 * `Button` and `IconButton` accept the same HTML attributes, but `IconButton`
 * forgoes a few props that don't apply to a square, label-less button. Skip
 * the rewrite when the author opted into one — they may rely on its semantics
 * (e.g. `as="summary"` for a `<details>` toggle).
 */
const incompatibleProps = new Set(['as']);

const resolveImportSource = (
  context: TSESLint.RuleContext<string, []>,
  identifier: TSESTree.JSXIdentifier,
): string | null => {
  const scope = context.sourceCode.getScope(identifier);
  const variable = ASTUtils.findVariable(scope, identifier.name);
  if (!variable) return null;

  const def = variable.defs[0];
  if (!def || def.type !== TSESLint.Scope.DefinitionType.ImportBinding) {
    return null;
  }
  if (def.parent?.type !== AST_NODE_TYPES.ImportDeclaration) return null;

  const source = def.parent.source.value;
  if (typeof source !== 'string') return null;

  return source;
};

const isMeaningfulChild = (child: TSESTree.JSXChild): boolean => {
  if (child.type === AST_NODE_TYPES.JSXText) {
    return child.value.trim().length > 0;
  }
  if (
    child.type === AST_NODE_TYPES.JSXExpressionContainer &&
    child.expression.type === AST_NODE_TYPES.JSXEmptyExpression
  ) {
    return false;
  }
  return true;
};

const rule = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Use <IconButton> for buttons whose only child is an icon. <Button> is sized for a text label; an icon-only label belongs in the square IconButton primitive.',
    },
    messages: {
      preferIconButton:
        '<Button> with a single icon child should be an <IconButton>.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXElement(node) {
        const opening = node.openingElement;
        if (opening.name.type !== AST_NODE_TYPES.JSXIdentifier) return;
        if (opening.name.name !== 'Button') return;

        const buttonSource = resolveImportSource(context, opening.name);
        if (buttonSource !== UI_IMPORT_SOURCE) return;

        for (const attr of opening.attributes) {
          if (attr.type !== AST_NODE_TYPES.JSXAttribute) continue;
          if (attr.name.type !== AST_NODE_TYPES.JSXIdentifier) continue;
          if (incompatibleProps.has(attr.name.name)) return;
        }

        const meaningful = node.children.filter(isMeaningfulChild);
        if (meaningful.length !== 1) return;

        const [only] = meaningful;
        if (only.type !== AST_NODE_TYPES.JSXElement) return;

        const childOpening = only.openingElement;
        if (childOpening.name.type !== AST_NODE_TYPES.JSXIdentifier) return;

        const iconSource = resolveImportSource(context, childOpening.name);
        if (!iconSource || !iconSource.startsWith(ICON_IMPORT_PREFIX)) return;

        context.report({
          node: opening,
          messageId: 'preferIconButton',
        });
      },
    };
  },
});

export default rule;
