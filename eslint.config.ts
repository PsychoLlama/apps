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
