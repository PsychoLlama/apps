import type { ESLint } from 'eslint';
import noStaticStyleProp from './rules/no-static-style-prop';
import requireDesignTokens from './rules/require-design-tokens';
import requireExplicitRouteExport from './rules/require-explicit-route-export';
import requireExternalizedEffects from './rules/require-externalized-effects';
import requireSelectableProp from './rules/require-selectable-prop';
import requireUiPrimitives from './rules/require-ui-primitives';

const plugin: ESLint.Plugin = {
  rules: {
    'no-static-style-prop': noStaticStyleProp,
    'require-design-tokens': requireDesignTokens,
    'require-explicit-route-export': requireExplicitRouteExport,
    'require-externalized-effects': requireExternalizedEffects,
    'require-selectable-prop': requireSelectableProp,
    'require-ui-primitives': requireUiPrimitives,
  },
};

export default plugin;
