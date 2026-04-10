import type { ESLint } from 'eslint';
import requireUiPrimitives from './rules/require-ui-primitives';

const plugin: ESLint.Plugin = {
  rules: {
    'require-ui-primitives': requireUiPrimitives,
  },
};

export default plugin;
