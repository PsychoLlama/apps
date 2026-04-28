import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../no-derived-token-types';

const tester = new RuleTester();

tester.run('no-derived-token-types', rule, {
  valid: [
    // Already using the exported alias.
    {
      code: "import { type SpaceScale } from '@lib/design'; type X = SpaceScale;",
    },

    // `keyof typeof` over something that isn't a tracked design token.
    { code: 'const local = { a: 1 } as const; type X = keyof typeof local;' },

    // Token imported but never used in a `keyof typeof`.
    { code: "import { space } from '@lib/design'; const x = space[1];" },

    // `typeof token` (value type, not keys) — out of scope.
    { code: "import { space } from '@lib/design'; type X = typeof space;" },

    // Token-shaped name from a different package.
    {
      code: "import { space } from 'somewhere-else'; type X = keyof typeof space;",
    },
  ],

  invalid: [
    // Each tracked token reports with the right alias.
    {
      code: "import { space } from '@lib/design'; type X = keyof typeof space;",
      errors: [
        {
          messageId: 'useExportedType',
          data: { token: 'space', type: 'SpaceScale' },
        },
      ],
    },
    {
      code: "import { radius } from '@lib/design'; type X = keyof typeof radius;",
      errors: [
        {
          messageId: 'useExportedType',
          data: { token: 'radius', type: 'RadiusScale' },
        },
      ],
    },
    {
      code: "import { shadow } from '@lib/design'; type X = keyof typeof shadow;",
      errors: [
        {
          messageId: 'useExportedType',
          data: { token: 'shadow', type: 'ShadowLevel' },
        },
      ],
    },
    {
      code: "import { fontWeight } from '@lib/design'; type X = keyof typeof fontWeight;",
      errors: [
        {
          messageId: 'useExportedType',
          data: { token: 'fontWeight', type: 'FontWeight' },
        },
      ],
    },
    {
      code: "import { typeScale } from '@lib/design'; type X = keyof typeof typeScale;",
      errors: [
        {
          messageId: 'useExportedType',
          data: { token: 'typeScale', type: 'TypeScale' },
        },
      ],
    },
    {
      code: "import { text } from '@lib/design'; type X = keyof typeof text;",
      errors: [
        {
          messageId: 'useExportedType',
          data: { token: 'text', type: 'TextColor' },
        },
      ],
    },
    {
      code: "import { background } from '@lib/design'; type X = keyof typeof background;",
      errors: [
        {
          messageId: 'useExportedType',
          data: { token: 'background', type: 'BackgroundColor' },
        },
      ],
    },

    // Tracks aliased imports.
    {
      code: "import { space as s } from '@lib/design'; type X = keyof typeof s;",
      errors: [{ messageId: 'useExportedType' }],
    },

    // Inside a generic position.
    {
      code: "import { fontWeight } from '@lib/design'; type Pairs = Array<[keyof typeof fontWeight, string]>;",
      errors: [{ messageId: 'useExportedType' }],
    },
  ],
});
