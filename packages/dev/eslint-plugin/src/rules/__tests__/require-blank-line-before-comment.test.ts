import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../require-blank-line-before-comment';

const tester = new RuleTester();
const missing = { messageId: 'missing' as const };

tester.run('require-blank-line-before-comment', rule, {
  valid: [
    // Already padded.
    { code: 'interface P {\n  a: 1;\n\n  /** doc */\n  b: 2;\n}' },
    { code: 'foo();\n\n// note\nbar();' },

    // First in a list: prettier strips the blank line after `{`.
    { code: 'interface P {\n  /** doc */\n  a: 1;\n}' },
    { code: 'const o = {\n  // note\n  a: 1,\n};' },
    { code: 'const f = () => {\n  // note\n  foo();\n};' },
    { code: '// header\nfoo();' },

    // Continuation of a comment block.
    { code: 'foo();\n\n// one\n// two\nbar();' },
    { code: 'foo();\n\n/** doc */\n// directive\nbar();' },

    // Trailing comments share a line with code.
    { code: 'foo(); // note\nbar();' },
    { code: 'const o = {\n  a: 1, // note\n  b: 2,\n};' },

    // Contexts where prettier removes or relocates the blank line.
    { code: 'type T<\n  A,\n  // note\n  B,\n> = A;' },
    { code: 'const t = cond\n  ? a\n  : // note\n    b;' },
    { code: 'type U =\n  | "a"\n  // note\n  | "b";' },
    { code: 'foo(\n  a,\n  // note\n  b,\n);' },
  ],

  invalid: [
    {
      code: 'interface P {\n  a: 1;\n  /** doc */\n  b: 2;\n}',
      output: 'interface P {\n  a: 1;\n\n  /** doc */\n  b: 2;\n}',
      errors: [missing],
    },
    {
      code: 'type P = {\n  a: 1;\n  // note\n  b: 2;\n};',
      output: 'type P = {\n  a: 1;\n\n  // note\n  b: 2;\n};',
      errors: [missing],
    },
    {
      code: 'class C {\n  a = 1;\n  // note\n  b = 2;\n}',
      output: 'class C {\n  a = 1;\n\n  // note\n  b = 2;\n}',
      errors: [missing],
    },
    {
      code: 'const o = {\n  a: 1,\n  // note\n  b: 2,\n};',
      output: 'const o = {\n  a: 1,\n\n  // note\n  b: 2,\n};',
      errors: [missing],
    },
    {
      code: 'const a = [\n  1,\n  // note\n  2,\n];',
      output: 'const a = [\n  1,\n\n  // note\n  2,\n];',
      errors: [missing],
    },
    {
      code: 'enum E {\n  A,\n  // note\n  B,\n}',
      output: 'enum E {\n  A,\n\n  // note\n  B,\n}',
      errors: [missing],
    },
    {
      code: 'foo();\n// note\nbar();',
      output: 'foo();\n\n// note\nbar();',
      errors: [missing],
    },
    {
      code: 'function f() {\n  foo();\n  // note\n  bar();\n}',
      output: 'function f() {\n  foo();\n\n  // note\n  bar();\n}',
      errors: [missing],
    },
    {
      code: 'switch (x) {\n  case 1:\n    foo();\n    // note\n    bar();\n  // next\n  case 2:\n}',
      output:
        'switch (x) {\n  case 1:\n    foo();\n\n    // note\n    bar();\n\n  // next\n  case 2:\n}',
      errors: [missing, missing],
    },

    // Trailing comment after the last member.
    {
      code: 'const o = {\n  a: 1,\n  // note\n};',
      output: 'const o = {\n  a: 1,\n\n  // note\n};',
      errors: [missing],
    },

    // A comment following a trailing comment still needs its blank line.
    {
      code: 'const o = {\n  a: 1, // trailing\n  // note\n  b: 2,\n};',
      output: 'const o = {\n  a: 1, // trailing\n\n  // note\n  b: 2,\n};',
      errors: [missing],
    },

    // Only the head of a comment block is reported.
    {
      code: 'foo();\n// one\n// two\nbar();',
      output: 'foo();\n\n// one\n// two\nbar();',
      errors: [missing],
    },
  ],
});
