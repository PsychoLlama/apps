import { RuleTester } from 'eslint';
import rule, { bannedElements } from '../require-ui-primitives';

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const invalid = [...bannedElements].map((element) => ({
  code: `<${element}>children</${element}>`,
  errors: [{ messageId: 'banned' as const, data: { element } }],
}));

tester.run('require-ui-primitives', rule as never, {
  valid: [
    // @lib/ui components are fine.
    { code: '<Flex as="div" />' },
    { code: '<Text as="p">hello</Text>' },
    { code: '<Heading as="h1">title</Heading>' },

    // Elements without a @lib/ui equivalent are allowed.
    { code: '<input />' },
    { code: '<img />' },
    // Document structure is allowed.
    { code: '<html><body></body></html>' },
  ],

  invalid,
});
