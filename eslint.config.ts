import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import customRules from './src/eslint-plugin';

export default [
  includeIgnoreFile(import.meta.dirname + '/.gitignore'),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
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
      'custom/require-ui-primitives': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['~icons/*'],
              message: 'Use virtual:icons/* instead.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.css.ts'],
    ignores: ['src/design/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
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
    files: ['./**/__tests__/*.ts{x,}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
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
