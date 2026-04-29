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
): {
  source: string;
  importDecl: TSESTree.ImportDeclaration;
} | null => {
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

  return { source, importDecl: def.parent };
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
    fixable: 'code',
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

        const buttonImport = resolveImportSource(context, opening.name);
        if (!buttonImport || buttonImport.source !== UI_IMPORT_SOURCE) return;

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

        const iconImport = resolveImportSource(context, childOpening.name);
        if (!iconImport) return;
        if (!iconImport.source.startsWith(ICON_IMPORT_PREFIX)) return;

        context.report({
          node: opening,
          messageId: 'preferIconButton',
          fix(fixer) {
            const fixes: TSESLint.RuleFix[] = [
              fixer.replaceText(opening.name, 'IconButton'),
            ];

            if (
              node.closingElement?.name.type === AST_NODE_TYPES.JSXIdentifier
            ) {
              fixes.push(
                fixer.replaceText(node.closingElement.name, 'IconButton'),
              );
            }

            const hasIconButton = buttonImport.importDecl.specifiers.some(
              (spec) =>
                spec.type === AST_NODE_TYPES.ImportSpecifier &&
                spec.local.name === 'IconButton',
            );

            if (!hasIconButton) {
              const buttonSpec = buttonImport.importDecl.specifiers.find(
                (spec): spec is TSESTree.ImportSpecifier =>
                  spec.type === AST_NODE_TYPES.ImportSpecifier &&
                  spec.local.name === 'Button',
              );
              if (buttonSpec) {
                fixes.push(fixer.insertTextBefore(buttonSpec, 'IconButton, '));
              }
            }

            return fixes;
          },
        });
      },
    };
  },
});

export default rule;
