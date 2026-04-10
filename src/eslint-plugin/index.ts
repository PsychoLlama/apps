import type { ESLint } from 'eslint';
import noStaticStyleProp from './rules/no-static-style-prop';
import requireDesignTokens from './rules/require-design-tokens';
import requireUiPrimitives from './rules/require-ui-primitives';

const plugin: ESLint.Plugin = {
  rules: {
    'no-static-style-prop': noStaticStyleProp,
    'require-design-tokens': requireDesignTokens,
    'require-ui-primitives': requireUiPrimitives,
  },
};

export default plugin;
