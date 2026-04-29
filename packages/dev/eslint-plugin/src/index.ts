import noDerivedTokenTypes from './rules/no-derived-token-types';
import noImportant from './rules/no-important';
import noStaticStyleProp from './rules/no-static-style-prop';
import noUnsafeNodeCast from './rules/no-unsafe-node-cast';
import noZIndex from './rules/no-z-index';
import preferIconButton from './rules/prefer-icon-button';
import requireDesignTokens from './rules/require-design-tokens';
import requireExplicitRouteExport from './rules/require-explicit-route-export';
import requireExternalizedEffects from './rules/require-externalized-effects';
import requireSelectableProp from './rules/require-selectable-prop';
import requireUiPrimitives from './rules/require-ui-primitives';

// `ESLint.Plugin` requires every rule to match the core `RuleDefinition`
// shape, which mixes contravariantly with the narrower `RuleModule`
// emitted by `ESLintUtils.RuleCreator`. Leave the type inferred so the
// flat-config loader widens it at the call site instead of forcing a
// double-cast here.
const plugin = {
  rules: {
    'no-derived-token-types': noDerivedTokenTypes,
    'no-important': noImportant,
    'no-static-style-prop': noStaticStyleProp,
    'no-unsafe-node-cast': noUnsafeNodeCast,
    'no-z-index': noZIndex,
    'prefer-icon-button': preferIconButton,
    'require-design-tokens': requireDesignTokens,
    'require-explicit-route-export': requireExplicitRouteExport,
    'require-externalized-effects': requireExternalizedEffects,
    'require-selectable-prop': requireSelectableProp,
    'require-ui-primitives': requireUiPrimitives,
  },
};

export default plugin;
