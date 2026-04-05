// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['.nitro/**', '.output/**', 'dist/**'] },
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
    rules: {
      '@typescript-eslint/no-use-before-define': 'off',
    },
  },
  {
    files: ['./**/__tests__/*.ts{x,}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
