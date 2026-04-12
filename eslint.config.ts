import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import solid from 'eslint-plugin-solid/configs/typescript';
import tseslint from 'typescript-eslint';
import customRules from './src/eslint-plugin';

const restrictedImportPatterns = [
  {
    group: ['~icons/*'],
    message: 'Use virtual:icons/* instead.',
  },
  {
    group: ['**/design/**'],
    message: 'Use #design instead.',
  },
  {
    group: ['**/ui/**'],
    message: 'Use #ui instead.',
  },
];

export default [
  includeIgnoreFile(import.meta.dirname + '/.gitignore'),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  solid,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      custom: customRules,
    },
    rules: {
      'solid/components-return-once': 'error',
      'solid/reactivity': 'error',
      'solid/event-handlers': 'error',
      'solid/imports': 'error',
      'solid/style-prop': 'error',
      'solid/no-react-deps': 'error',
      'solid/no-react-specific-props': 'error',
      'solid/self-closing-comp': 'error',
      'solid/no-array-handlers': 'error',
      'no-console': 'error',
      eqeqeq: 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-deprecated': 'error',
      'custom/no-static-style-prop': 'error',
      'custom/require-ui-primitives': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: restrictedImportPatterns,
        },
      ],
    },
  },
  {
    files: ['src/**/*.css.ts'],
    ignores: ['src/design/**'],
    rules: {
      'custom/require-design-tokens': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: restrictedImportPatterns,
          paths: [
            {
              name: '@vanilla-extract/css',
              importNames: ['globalStyle'],
              message:
                'globalStyle is restricted to #design. The global CSS reset (all: unset) strips UA defaults, so component styles should not need global overrides.',
            },
          ],
        },
      ],
    },
  },
  {
    // Stories use inline static styles to demo design tokens (swatches, spacing
    // previews, etc.). These are presentational, not production UI.
    files: ['./**/*.stories.tsx'],
    rules: {
      'custom/no-static-style-prop': 'off',
    },
  },
  {
    files: ['./**/__tests__/*.ts{x,}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: restrictedImportPatterns,
          paths: [
            {
              name: 'vitest',
              importNames: ['test', 'it'],
              message: 'Always prefer vitest globals.',
            },
          ],
        },
      ],
    },
  },
];
