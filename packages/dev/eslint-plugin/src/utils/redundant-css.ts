import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { getPropertyName } from './ast';

/**
 * Properties whose initial value after `all: unset` is `0`. Restating the
 * default — whether numerically (`0`, `'0px'`) or via the `unset` keyword —
 * is a reliable signal the author didn't realize the global reset already
 * cleared it.
 */
export const redundantResetProperties = new Set([
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingBlock',
  'paddingBlockStart',
  'paddingBlockEnd',
  'paddingInline',
  'paddingInlineStart',
  'paddingInlineEnd',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginBlock',
  'marginBlockStart',
  'marginBlockEnd',
  'marginInline',
  'marginInlineStart',
  'marginInlineEnd',
  'gap',
  'rowGap',
  'columnGap',
  'borderWidth',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'outlineWidth',
  'outlineOffset',
]);

const ZERO_RE = /^0(px|rem|em|%)?$/;

const isZeroValue = (value: unknown): boolean => {
  if (value === 0) return true;
  if (typeof value === 'string') return ZERO_RE.test(value);
  return false;
};

/** Values that re-assert the post-reset default for the properties above. */
export const isResetValue = (value: unknown): boolean =>
  isZeroValue(value) || value === 'unset';

export const redundantResetMessage =
  '{{property}}: {{value}} is unnecessary — the global CSS reset (all: unset) already removes this default.';

/**
 * Walks ancestors looking for a vanilla-extract block that scopes the
 * declaration to a specialization (`selectors`, `@media`, `@supports`,
 * `@container`, `@layer`, …). Inside one of these, restating the default
 * is interpreted as undoing the author's own styles, not ignorance of the
 * reset.
 */
export const isInsideSpecialization = (node: TSESTree.Node): boolean => {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (current.type === AST_NODE_TYPES.Property) {
      const key = getPropertyName(current.key);
      if (key === 'selectors' || (key !== null && key.startsWith('@'))) {
        return true;
      }
    }
    current = current.parent;
  }
  return false;
};

/**
 * Properties where a full-viewport height is redundant because the body
 * global already applies `minHeight: 100dvh` with a flex column layout.
 * Route-level descendants should use `grow` / `flex: 1` / `height: 100%`
 * instead of restating the viewport height.
 */
export const redundantFullViewportProperties = new Set(['height', 'minHeight']);

/** Matches `100vh`, `100dvh`, `100svh`, `100lvh` (case-insensitive). */
const FULL_VIEWPORT_RE = /^100(d|s|l)?vh$/i;

const isFullViewportString = (value: unknown): value is string =>
  typeof value === 'string' && FULL_VIEWPORT_RE.test(value);

/**
 * Inspects a vanilla-extract property value node and returns the first
 * full-viewport string it finds, or `null`. Handles both plain literals
 * (`'100dvh'`) and fallback array forms (`['100vh', '100dvh']`) so the
 * rule can't be bypassed by wrapping the offending value in the same
 * array syntax the body reset uses.
 */
export const findFullViewportValue = (
  node: TSESTree.Property['value'],
): string | null => {
  if (
    node.type === AST_NODE_TYPES.Literal &&
    isFullViewportString(node.value)
  ) {
    return node.value;
  }

  if (node.type === AST_NODE_TYPES.ArrayExpression) {
    for (const element of node.elements) {
      if (
        element &&
        element.type === AST_NODE_TYPES.Literal &&
        isFullViewportString(element.value)
      ) {
        return element.value;
      }
    }
  }

  return null;
};

export const redundantFullViewportMessage =
  '{{property}}: {{value}} duplicates the global body reset (minHeight: 100dvh). Use `grow` / `flex: 1` / `height: 100%` instead.';
