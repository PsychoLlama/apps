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
 * Inside one of these, restating the post-reset default is *potentially*
 * undoing the author's own styles — pair with `hasOverrideTarget` to
 * confirm there's actually something to undo.
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
 * Maps a property name to its "family" — the group whose declarations can
 * affect the same visual outcome. Used to decide whether a redundant-reset
 * value inside a specialization has anything outer to undo.
 *
 * Width and style properties share a family for borders and outlines: a
 * `borderWidth: 0` inside a specialization is a real override if the
 * outer scope enabled the stroke via `borderStyle: 'solid'` — even
 * though no outer `borderWidth` exists, the inner `0` removes a
 * visible border.
 */
const propertyFamily = (name: string): string | null => {
  if (name.startsWith('padding')) return 'padding';
  if (name.startsWith('margin')) return 'margin';
  if (name === 'gap' || name === 'rowGap' || name === 'columnGap') {
    return 'gap';
  }
  if (/^border([A-Z][a-zA-Z]*)?(Width|Style)$/.test(name)) return 'border';
  if (name === 'outlineWidth' || name === 'outlineStyle') return 'outline';
  if (name === 'outlineOffset') return 'outlineOffset';
  return null;
};

/**
 * Whether `obj` is a vanilla-extract style scope (the kind of object you'd
 * pass to `style()`) rather than a variants record (the kind you'd pass to
 * `styleVariants()` or use under `recipe()`'s `variants:` key). Detected
 * structurally: a style scope has at least one direct CSS-declaration or
 * specialization-gate child; a variants record only has variant-name keys
 * mapping to nested objects.
 */
const isStyleScope = (obj: TSESTree.ObjectExpression): boolean => {
  for (const prop of obj.properties) {
    if (prop.type !== AST_NODE_TYPES.Property) continue;
    if (isSpecializationKey(getPropertyName(prop.key))) return true;
    // Any non-object value indicates a CSS declaration. Variant records
    // only contain Property children whose values are ObjectExpression.
    if (prop.value.type !== AST_NODE_TYPES.ObjectExpression) return true;
  }
  return false;
};

/**
 * Whether `obj`'s parent Property is a specialization gate (`selectors`
 * or an `@`-prefixed at-rule). Such an object isn't itself a style scope
 * — it's a transparent container holding selector/query sub-keys whose
 * values are the real scopes. Walks should pass through it.
 */
const isSpecializationContainer = (obj: TSESTree.ObjectExpression): boolean => {
  const parent = obj.parent;
  if (!parent || parent.type !== AST_NODE_TYPES.Property) return false;
  return isSpecializationKey(getPropertyName(parent.key));
};

/**
 * Whether the surrounding style object declares a same-family property
 * that `node` could plausibly be overriding.
 *
 * Walks the *active ancestor path* of style scopes — starting at the
 * scope directly enclosing `node`, stepping through specialization
 * containers transparently, and continuing up through outer style
 * scopes. At each scope, only that scope's direct CSS-property children
 * count as override targets. Sibling specialization branches (e.g.,
 * `selectors: { '&:focus': ..., '&:hover': ... }`) are *not* mutually
 * inspected — those rules apply in different element states, so a
 * declaration on one isn't a target for the other.
 *
 * Inside `node`'s own scope, only declarations that come *before* it
 * count: a later same-family declaration overrides this one within the
 * same CSS rule, leaving this one as dead code rather than an
 * override.
 *
 * The walk stops at any ObjectExpression that isn't a style scope —
 * variants records from `styleVariants` or `recipe`'s `variants:` —
 * since sibling variants are mutually-exclusive classes at runtime.
 *
 * Cross-class composition (multiple `style()` classes applied together)
 * stays invisible. Genuine composition overrides need an explicit
 * eslint-disable.
 */
export const hasOverrideTarget = (
  node: TSESTree.Property,
  name: string,
): boolean => {
  const family = propertyFamily(name);
  if (!family) return false;

  const isOverrideTarget = (prop: TSESTree.Property): boolean => {
    const propName = getPropertyName(prop.key);
    if (!propName || propertyFamily(propName) !== family) return false;
    if (prop.value.type === AST_NODE_TYPES.ObjectExpression) return false;
    if (prop.value.type === AST_NODE_TYPES.Literal) {
      return !isRedundantResetValue(propName, prop.value.value);
    }
    // Identifier, MemberExpression, ArrayExpression (CSS fallback),
    // TemplateLiteral, CallExpression, etc.
    return true;
  };

  let current: TSESTree.Node | undefined = node.parent;
  while (current) {
    if (current.type === AST_NODE_TYPES.ObjectExpression) {
      if (isSpecializationContainer(current)) {
        // Selectors / at-rule blocks aren't scopes themselves; their
        // sub-keys' values are. Step through transparently.
      } else if (isStyleScope(current)) {
        const isInnerScope = current === node.parent;
        for (const prop of current.properties) {
          if (prop.type !== AST_NODE_TYPES.Property) continue;
          if (prop === node) {
            // Inside `node`'s own scope, only earlier siblings count
            // — anything after `node` overrides it within the same
            // CSS rule and leaves `node` as dead code.
            if (isInnerScope) break;
            continue;
          }
          if (isOverrideTarget(prop)) return true;
        }
      } else {
        // Variant record (or other non-style ObjectExpression). Don't
        // cross — siblings here are independent classes.
        return false;
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
