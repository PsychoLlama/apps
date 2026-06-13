import { includeIgnoreFile } from '@eslint/config-helpers';
import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import solid from 'eslint-plugin-solid/configs/typescript';
import tseslint from 'typescript-eslint';
import customRules from '@dev/eslint-plugin';

const restrictedImportPatterns = [
  {
    group: ['~icons/*'],
    message: 'Use virtual:icons/* instead.',
  },
  {
    regex: '^node:fs$',
    message: 'Use node:fs/promises — synchronous fs is banned.',
  },
];

const restrictedStatePaths = [
  {
    name: 'solid-js',
    importNames: ['createSignal', 'createResource'],
    message: 'Use @lib/state for state management.',
  },
  {
    name: 'solid-js/store',
    message: 'Use @lib/state for state management.',
  },
];

export default [
  includeIgnoreFile(import.meta.dirname + '/.gitignore'),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  solid,
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      custom: customRules,
      import: importPlugin,
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
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-empty-named-blocks': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-self-import': 'error',
      'import/no-mutable-exports': 'error',
      'import/no-extraneous-dependencies': 'error',
      'import/no-relative-packages': 'error',
      'no-console': 'error',
      eqeqeq: 'error',
      'func-style': ['error', 'expression'],
      'id-length': ['error', { min: 2, properties: 'never' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'custom/no-derived-token-types': 'error',
      'custom/no-log-interpolation': 'error',
      'custom/no-static-style-prop': 'error',
      'custom/prefer-icon-button': 'error',
      'custom/require-externalized-effects': 'error',
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
    // Rule files should rely on ESLint's built-in listener narrowing and
    // `TSESTree` node types instead of reaching for `as unknown as {...}`.
    // Tests under `__tests__/` exercise rules through fixtures, where
    // escape hatches are sometimes legitimate — so this is scoped to the
    // rule sources themselves.
    files: ['packages/dev/eslint-plugin/src/rules/*.ts'],
    rules: {
      'custom/no-unsafe-node-cast': 'error',
    },
  },
  {
    // SolidStart's lazy loader needs a literal `import` and `export default`
    // in route sources. `_`-prefixed files are ignored by the router, so
    // the rule doesn't apply there.
    files: ['packages/app/main/src/routes/**/*.tsx'],
    ignores: [
      'packages/app/main/src/routes/**/_*.tsx',
      'packages/app/main/src/routes/**/_*/**',
    ],
    rules: {
      'custom/require-explicit-route-export': 'error',
    },
  },
  {
    // `!important` and `z-index` are banned across every stylesheet,
    // including `@lib/design` and stories — we control the entire
    // codebase, so the legitimate workarounds (raising specificity,
    // document order, portals, `isolation`) are always available.
    files: ['packages/**/*.css.ts'],
    rules: {
      'custom/no-important': 'error',
      'custom/no-z-index': 'error',
    },
  },
  {
    files: ['packages/**/*.css.ts'],
    ignores: [
      'packages/lib/design/src/**',
      'packages/dev/storybook/src/stories/**/*.stories.css.ts',
    ],
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
                'globalStyle is restricted to @lib/design. The global CSS reset (all: unset) strips UA defaults, so component styles should not need global overrides.',
            },
          ],
        },
      ],
    },
  },
  {
    // Stories use inline static styles to demo design tokens (swatches, spacing
    // previews, etc.). These are presentational, not production UI.
    files: ['**/*.stories.tsx'],
    rules: {
      'custom/no-static-style-prop': 'off',
    },
  },
  {
    files: ['**/__tests__/*.ts{x,}'],
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
    // @lib/state internals may use solid-js/store directly.
    files: ['packages/lib/state/src/**/*.ts'],
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
    // @lib/ui primitives implement the components the rule redirects
    // everyone else toward — they have to use raw elements.
    files: ['packages/lib/ui/src/components/**/*.tsx'],
    rules: {
      'custom/require-ui-primitives': 'off',
    },
  },
  {
    // @lib/state tests exercise defineEffect itself, so inline callbacks
    // are expected. The separation rule applies to consumers.
    files: ['packages/lib/state/src/__tests__/**/*.ts'],
    rules: {
      'custom/require-externalized-effects': 'off',
    },
  },
  {
    // @lib/ui and @lib/design are foundation libraries, not application
    // surfaces. The state-management framework is heavyweight and exists
    // for application state — the wrong fit for primitive components'
    // local UI state or design-token internals.
    files: [
      'packages/lib/ui/**/*.{ts,tsx}',
      'packages/lib/design/**/*.{ts,tsx}',
    ],
    // `.css.ts` files are governed by the `packages/**/*.css.ts` block
    // above (which carries the globalStyle ban). Without this ignore,
    // this override would clobber that rule and silently drop the ban.
    ignores: ['**/*.css.ts'],
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
    // Storybook stories and `*.gallery.tsx` files demo components in
    // isolation. Local UI state belongs to the demo wrapper, not
    // application state, so plain Solid primitives are the right fit.
    files: [
      'packages/dev/storybook/**/*.{ts,tsx}',
      'packages/**/*.gallery.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: restrictedImportPatterns,
        },
      ],
    },
  },
];
