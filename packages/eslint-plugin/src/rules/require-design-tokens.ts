import type { Rule } from 'eslint';
import { getPropertyName } from '../utils/ast';
import {
  isZeroValue,
  redundantZeroMessage,
  redundantZeroProperties,
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

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ban hard-coded values in vanilla-extract style fields owned by the design system.',
    },
    messages: {
      hardcoded:
        'Hard-coded {{property}} value. Use a {{token}} token from #design instead.',
      redundantZero: redundantZeroMessage,
    },
    schema: [],
  },

  create(context) {
    return {
      Property(node: Rule.Node) {
        const prop = node as unknown as {
          key: { type: string; name?: string; value?: string };
          value: { type: string; value?: unknown };
        };

        const name = getPropertyName(prop.key);
        if (!name) return;

        const token = propertyToToken.get(name);
        const isRedundantZeroProp = redundantZeroProperties.has(name);

        if (!token && !isRedundantZeroProp) return;

        if (prop.value.type !== 'Literal') return;
        const value = prop.value.value;

        // Null values appear in createThemeContract — always allowed.
        if (value === null) return;

        if (typeof value === 'string' && cssKeywords.has(value)) return;

        if (isRedundantZeroProp && isZeroValue(value)) {
          context.report({
            node,
            messageId: 'redundantZero',
            data: { property: name },
          });
          return;
        }

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
};

export default rule;
