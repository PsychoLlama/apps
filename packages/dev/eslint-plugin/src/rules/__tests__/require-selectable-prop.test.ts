import { RuleTester } from 'eslint';
import rule from '../require-selectable-prop';

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run('require-selectable-prop', rule, {
  valid: [
    // Static children: no prop required.
    { code: '<Text as="p">Hello world</Text>' },
    { code: '<Heading as="h1">Page Title</Heading>' },

    // Dynamic children with explicit selectable={true}.
    { code: '<Text as="p" selectable={true}>{message}</Text>' },
    { code: '<Heading as="h2" selectable={true}>{title}</Heading>' },

    // Dynamic children with explicit selectable={false}.
    { code: '<Text as="span" selectable={false}>{count} items</Text>' },
    { code: '<Heading as="h3" selectable={false}>{label}</Heading>' },

    // Unrelated components are ignored.
    { code: '<Paragraph>{content}</Paragraph>' },
    { code: '<Label>{name}</Label>' },

    // Self-closing (no children).
    { code: '<Text as="span" />' },
  ],

  invalid: [
    {
      code: '<Text as="p">{message}</Text>',
      errors: [{ messageId: 'missing' }],
    },
    {
      code: '<Heading as="h1">{title}</Heading>',
      errors: [{ messageId: 'missing' }],
    },
    {
      // Mixed static and dynamic children.
      code: '<Text as="span">Total: {count}</Text>',
      errors: [{ messageId: 'missing' }],
    },
  ],
});
