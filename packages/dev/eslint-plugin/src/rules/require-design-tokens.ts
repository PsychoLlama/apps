import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import { getPropertyName } from '../utils/ast';
import {
  findFullViewportValue,
  isInsideSpecialization,
  isResetValue,
  redundantFullViewportMessage,
  redundantFullViewportProperties,
  redundantResetMessage,
  redundantResetProperties,
} from '../utils/redundant-css';

// ---------------------------------------------------------------------------
// Property → token mapping
// ---------------------------------------------------------------------------

/** Every design-system-owned property mapped to its token name. */
export const propertyToToken = new Map<string, string>();

for (const [token, properties] of [
  [
    'space',
    [
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
    ],
  ],
  [
    'color',
    [
      'color',
      'backgroundColor',
      'borderColor',
      'outlineColor',
      'fill',
      'stroke',
      'caretColor',
      'textDecorationColor',
      'accentColor',
      'columnRuleColor',
    ],
  ],
  ['typeScale', ['fontSize', 'lineHeight', 'letterSpacing']],
  ['fontFamily', ['fontFamily']],
  ['fontWeight', ['fontWeight']],
  [
    'radius',
    [
      'borderRadius',
      'borderTopLeftRadius',
      'borderTopRightRadius',
      'borderBottomLeftRadius',
      'borderBottomRightRadius',
      'borderStartStartRadius',
      'borderStartEndRadius',
      'borderEndStartRadius',
      'borderEndEndRadius',
    ],
  ],
  ['shadow', ['boxShadow']],
  [
    'motion',
    [
      'transition',
      'transitionDuration',
      'transitionTimingFunction',
      'animation',
      'animationDuration',
      'animationTimingFunction',
    ],
  ],
] as const) {
  for (const prop of properties) {
    propertyToToken.set(prop, token);
  }
}

// ---------------------------------------------------------------------------
// CSS keywords that are always acceptable as literal values
// ---------------------------------------------------------------------------

const cssKeywords = new Set([
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'auto',
  'none',
  'normal',
  'transparent',
  'currentColor',
  'currentcolor',
]);

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const rule = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ban hard-coded values in vanilla-extract style fields owned by the design system.',
    },
    messages: {
      hardcoded:
        'Hard-coded {{property}} value. Use a {{token}} token from @lib/design instead.',
      redundantReset: redundantResetMessage,
      redundantFullViewport: redundantFullViewportMessage,
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Property(node) {
        const name = getPropertyName(node.key);
        if (!name) return;

        const token = propertyToToken.get(name);
        const isRedundantResetProp = redundantResetProperties.has(name);
        const isRedundantFullViewportProp =
          redundantFullViewportProperties.has(name);

        if (!token && !isRedundantResetProp && !isRedundantFullViewportProp) {
          return;
        }

        // Viewport-redundancy check runs before the Literal-only guard so
        // it can also catch the vanilla-extract fallback array form
        // (e.g. `minHeight: ['100vh', '100dvh']`), which is the exact
        // pattern the body reset itself uses.
        if (isRedundantFullViewportProp) {
          const offender = findFullViewportValue(node.value);
          if (offender !== null) {
            context.report({
              node,
              messageId: 'redundantFullViewport',
              data: { property: name, value: offender },
            });
            return;
          }
        }

        if (node.value.type !== AST_NODE_TYPES.Literal) return;
        const value = node.value.value;

        // Null values appear in createThemeContract — always allowed.
        if (value === null) return;

        // Restating the post-reset default is the targeted smell. Inside a
        // specialization (`selectors`, `@media`, …) the same value is
        // legitimate — the author is undoing a style they themselves set.
        if (isRedundantResetProp && isResetValue(value)) {
          if (isInsideSpecialization(node)) return;
          context.report({
            node,
            messageId: 'redundantReset',
            data: { property: name, value: String(value) },
          });
          return;
        }

        if (typeof value === 'string' && cssKeywords.has(value)) return;

        if (token) {
          context.report({
            node,
            messageId: 'hardcoded',
            data: { property: name, token },
          });
        }
      },
    };
  },
});

export default rule;
