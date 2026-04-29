import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../prefer-icon-button';

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const importLine = "import { Button } from '@lib/ui';";
const iconImport = "import IconClose from 'virtual:icons/mdi/close';";

tester.run('prefer-icon-button', rule, {
  valid: [
    // Buttons with text content.
    {
      code: `${importLine} const x = <Button>Save</Button>;`,
    },

    // Icon followed by a text label — the label needs the wider footprint.
    {
      code: `${importLine}${iconImport} const x = <Button><IconClose />Close</Button>;`,
    },

    // Multiple element children.
    {
      code: `${importLine}${iconImport} const x = <Button><IconClose /><IconClose /></Button>;`,
    },

    // `as` opts into Button's polymorphic semantics — IconButton can't replace it.
    {
      code: `${importLine}${iconImport} const x = <Button as="summary"><IconClose /></Button>;`,
    },

    // The `Button` identifier doesn't come from `@lib/ui`.
    {
      code: `import { Button } from 'somewhere-else';${iconImport} const x = <Button><IconClose /></Button>;`,
    },

    // The sole child isn't an icon.
    {
      code: `${importLine} import { Avatar } from '@lib/ui'; const x = <Button><Avatar /></Button>;`,
    },

    // JSXExpressionContainer wrapping an icon — strict mode skips it.
    {
      code: `${importLine}${iconImport} const x = <Button>{<IconClose />}</Button>;`,
    },

    // Self-closing Button (no children) — nothing to flag.
    {
      code: `${importLine} const x = <Button aria-label="x" />;`,
    },

    // IconButton itself, of course.
    {
      code: `import { IconButton } from '@lib/ui';${iconImport} const x = <IconButton aria-label="x"><IconClose /></IconButton>;`,
    },
  ],

  invalid: [
    // Canonical case: rewrites Button → IconButton and adds it to the import.
    {
      code: `${importLine}${iconImport} const x = <Button aria-label="Close"><IconClose /></Button>;`,
      output: `import { IconButton, Button } from '@lib/ui';${iconImport} const x = <IconButton aria-label="Close"><IconClose /></IconButton>;`,
      errors: [{ messageId: 'preferIconButton' }],
    },

    // Whitespace around the icon doesn't count as content.
    {
      code: `${importLine}${iconImport} const x = <Button>\n  <IconClose />\n</Button>;`,
      output: `import { IconButton, Button } from '@lib/ui';${iconImport} const x = <IconButton>\n  <IconClose />\n</IconButton>;`,
      errors: [{ messageId: 'preferIconButton' }],
    },

    // Existing IconButton import — fix shouldn't duplicate it.
    {
      code: `import { Button, IconButton } from '@lib/ui';${iconImport} void IconButton; const x = <Button><IconClose /></Button>;`,
      output: `import { Button, IconButton } from '@lib/ui';${iconImport} void IconButton; const x = <IconButton><IconClose /></IconButton>;`,
      errors: [{ messageId: 'preferIconButton' }],
    },

    // Icons sourced from a different `virtual:icons/*` namespace still count.
    {
      code: `${importLine} import IconStar from 'virtual:icons/lucide/star'; const x = <Button><IconStar /></Button>;`,
      output: `import { IconButton, Button } from '@lib/ui'; import IconStar from 'virtual:icons/lucide/star'; const x = <IconButton><IconStar /></IconButton>;`,
      errors: [{ messageId: 'preferIconButton' }],
    },
  ],
});
