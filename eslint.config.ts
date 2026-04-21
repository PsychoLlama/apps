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

const restrictedStatePaths = [
  {
    name: 'solid-js',
    importNames: ['createSignal', 'createResource'],
    message: 'Use #state for state management.',
  },
  {
    name: 'solid-js/store',
    message: 'Use #state for state management.',
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
      'id-length': ['error', { min: 2, properties: 'never' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'custom/no-static-style-prop': 'error',
      'custom/require-selectable-prop': 'error',
      'custom/require-ui-primitives': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: restrictedImportPatterns,
          paths: restrictedStatePaths,
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
            ...restrictedStatePaths,
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
      'custom/require-selectable-prop': 'off',
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
            ...restrictedStatePaths,
            {
              name: 'vitest',
              importNames: [
                'afterAll',
                'afterEach',
                'assert',
                'beforeAll',
                'beforeEach',
                'describe',
                'expect',
                'expectTypeOf',
                'it',
                'suite',
                'test',
                'vi',
              ],
              message: 'Always prefer vitest globals.',
            },
          ],
        },
      ],
    },
  },
  {
    // #state internals may use solid-js/store directly.
    files: ['src/state/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: restrictedImportPatterns,
        },
      ],
    },
  },
  {
    // #ui primitives implement the components the rule redirects everyone
    // else toward — they have to use raw elements.
    files: ['src/ui/components/**/*.tsx'],
    rules: {
      'custom/require-ui-primitives': 'off',
    },
  },
];
