import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { getPropertyName } from './ast';

/**
 * Properties where `0` is functionally redundant after the global reset.
 * Some have non-zero spec initials (e.g. `border-width: medium`) but the
 * reset zeros out a related property (`border-style: none`) so any width
 * is invisible — a literal `0` adds no new behavior.
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

/**
 * Subset of the above where `'unset'` is also redundant: the spec initial
 * value is exactly `0`, so `unset` resolves to `0`. Excludes properties
 * whose initial is `medium` (`border-width`, `outline-width`) or `normal`
 * (`gap` family) — there `unset` does *not* equal `0`, even if the
 * post-reset rendering looks the same.
 */
const unsetRedundantProperties = new Set([
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
  'outlineOffset',
]);

const ZERO_RE = /^0(px|rem|em|%)?$/;

const isZeroValue = (value: unknown): boolean => {
  if (value === 0) return true;
  if (typeof value === 'string') return ZERO_RE.test(value);
  return false;
};

/**
 * Whether `value` is a redundant reset for `name`. Caller has already
 * confirmed `name ∈ redundantResetProperties`.
 */
export const isRedundantResetValue = (
  name: string,
  value: unknown,
): boolean => {
  if (isZeroValue(value)) return true;
  return value === 'unset' && unsetRedundantProperties.has(name);
};

export const redundantResetMessage =
  '{{property}}: {{value}} is unnecessary — the global CSS reset (all: unset) already removes this default.';

/**
 * Whether `key` names a vanilla-extract block whose contents apply
 * conditionally on top of the surrounding scope's cascade — `selectors`,
 * `@media`, `@supports`, `@container`, etc. Excludes `@layer`, which
 * *demotes* its declarations in the cascade rather than specializing
 * them: an inner reset under `@layer` doesn't override an unlayered
 * outer declaration, so the same exemption logic doesn't apply.
 */
const isSpecializationKey = (key: string | null): boolean => {
  if (key === null) return false;
  if (key === 'selectors') return true;
  if (!key.startsWith('@')) return false;
  return key !== '@layer';
};

/**
 * Walks ancestors looking for a vanilla-extract specialization block.
 * Inside one of these, restating the post-reset default is treated as
 * undoing the author's own styles — exempted from the redundant-reset
 * check.
 *
 * This is a deliberately coarse heuristic. We don't try to verify that
 * the inner reset has a real same-family target in an outer scope: the
 * trade-off is some false negatives (a bare `style({ '@media': { ...:
 * { padding: 0 } } })` with nothing outer to override slips through) in
 * exchange for a maintainable rule. The dominant case the rule is meant
 * to catch — top-level `padding: 0` written without realising the reset
 * already cleared it — is unaffected.
 */
export const isInsideSpecialization = (node: TSESTree.Node): boolean => {
  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (current.type === AST_NODE_TYPES.Property) {
      if (isSpecializationKey(getPropertyName(current.key))) return true;
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
