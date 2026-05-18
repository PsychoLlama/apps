import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../no-log-interpolation';

const tester = new RuleTester();

const withLogger = (body: string) =>
  `
  import { createLogger } from '@lib/observability';
  const logger = createLogger(['scope']);
  ${body}
  `;

tester.run('no-log-interpolation', rule, {
  valid: [
    // Constant message + structured context — the canonical shape.
    {
      code: withLogger("logger.info('Completed', { time });"),
    },

    // Identifier passed straight through is fine; the dynamic data isn't
    // being baked into the message string here.
    {
      code: withLogger('logger.warn(message);'),
    },

    // Template literal with no expressions is just a string.
    {
      code: withLogger('logger.error(`stable message`);'),
    },

    // Every level is covered, all with constant messages.
    {
      code: withLogger(`
        logger.trace('a');
        logger.debug('b');
        logger.info('c');
        logger.warn('d');
        logger.error('e');
        logger.fatal('f');
      `),
    },

    // Namespace chains preserve logger identity but constant message is fine.
    {
      code: withLogger("logger.namespace('sub').info('msg', { x });"),
    },

    // Derived logger via .namespace() — still a logger, still fine.
    {
      code: `
        import { createLogger } from '@lib/observability';
        const root = createLogger(['scope']);
        const child = root.namespace('child');
        child.info('msg', { x });
      `,
    },

    // The entry-client form: chained .namespace() directly off createLogger.
    {
      code: `
        import { createLogger } from '@lib/observability';
        const logger = createLogger(['scope']).namespace('sw');
        logger.info('msg', { x });
      `,
    },

    // Unrelated object happens to share method names — not a logger.
    {
      code: 'const reporter = { info: (s) => s }; reporter.info(`hi ${name}`);',
    },

    // `createLogger` from somewhere other than `@lib/observability` is
    // not our concern — we don't track it.
    {
      code: "import { createLogger } from 'other-pkg'; const l = createLogger(); l.info(`hi ${x}`);",
    },

    // String concatenation is not what we're targeting here.
    {
      code: withLogger("logger.info('prefix:' + suffix);"),
    },
  ],

  invalid: [
    // The headline case from the rule's docstring.
    {
      code: withLogger('logger.info(`Completed after ${time}ms`);'),
      errors: [{ messageId: 'interpolated' as const }],
    },

    // Every level traps the same way.
    {
      code: withLogger('logger.trace(`x ${y}`);'),
      errors: [{ messageId: 'interpolated' as const }],
    },
    {
      code: withLogger('logger.debug(`x ${y}`);'),
      errors: [{ messageId: 'interpolated' as const }],
    },
    {
      code: withLogger('logger.warn(`x ${y}`);'),
      errors: [{ messageId: 'interpolated' as const }],
    },
    {
      code: withLogger('logger.error(`x ${y}`);'),
      errors: [{ messageId: 'interpolated' as const }],
    },
    {
      code: withLogger('logger.fatal(`x ${y}`);'),
      errors: [{ messageId: 'interpolated' as const }],
    },

    // Namespace chains stay covered.
    {
      code: withLogger("logger.namespace('sub').info(`hi ${name}`);"),
      errors: [{ messageId: 'interpolated' as const }],
    },

    // Variable derived via .namespace() inherits logger identity.
    {
      code: `
        import { createLogger } from '@lib/observability';
        const root = createLogger(['scope']);
        const child = root.namespace('child');
        child.warn(\`oops \${err}\`);
      `,
      errors: [{ messageId: 'interpolated' as const }],
    },

    // The entry-client form: chained .namespace() directly off createLogger.
    {
      code: `
        import { createLogger } from '@lib/observability';
        const logger = createLogger(['scope']).namespace('sw');
        logger.info(\`hi \${name}\`);
      `,
      errors: [{ messageId: 'interpolated' as const }],
    },

    // Aliased import — local name is what matters.
    {
      code: `
        import { createLogger as makeLogger } from '@lib/observability';
        const logger = makeLogger(['scope']);
        logger.info(\`uh oh \${x}\`);
      `,
      errors: [{ messageId: 'interpolated' as const }],
    },

    // Call appears before its binding in source order — Program:exit
    // resolution should still catch it.
    {
      code: `
        import { createLogger } from '@lib/observability';
        const reportLater = () => logger.info(\`late \${x}\`);
        const logger = createLogger(['scope']);
      `,
      errors: [{ messageId: 'interpolated' as const }],
    },
  ],
});
