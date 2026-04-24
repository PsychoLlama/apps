/** Properties where 0 is the initial value after `all: unset`. */
export const redundantZeroProperties = new Set([
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

export const isZeroValue = (value: unknown): boolean => {
  if (value === 0) return true;
  if (typeof value === 'string') return ZERO_RE.test(value);
  return false;
};

export const redundantZeroMessage =
  '{{property}}: 0 is unnecessary — the global CSS reset (all: unset) already removes this default.';

/**
 * Properties where a full-viewport height is redundant because the body
 * global already applies `minHeight: 100dvh` with a flex column layout.
 * Route-level descendants should use `grow` / `flex: 1` / `height: 100%`
 * instead of restating the viewport height.
 */
export const redundantFullViewportProperties = new Set(['height', 'minHeight']);

/** Matches `100vh`, `100dvh`, `100svh`, `100lvh` (case-insensitive). */
const FULL_VIEWPORT_RE = /^100(d|s|l)?vh$/i;

export const isFullViewportValue = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  return FULL_VIEWPORT_RE.test(value);
};

export const redundantFullViewportMessage =
  '{{property}}: {{value}} duplicates the global body reset (minHeight: 100dvh). Use `grow` / `flex: 1` / `height: 100%` instead.';
