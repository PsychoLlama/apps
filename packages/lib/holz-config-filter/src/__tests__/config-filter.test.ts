/**
 * Behavioral tests for the config filter. Logs are driven through a real
 * `@holz/core` logger, exercising the production path: `logger.info(...)` →
 * config filter → recording processor.
 *
 * These run under jsdom, where OPFS is absent — so `readEnvironment` resolves
 * to the option's per-environment default, and the resolved environment is
 * `development` (vitest's `test` mode falls back to it). That's enough to
 * cover buffering, default resolution, and live updates; the OPFS-backed
 * override path is covered by `@lib/runtime-config`'s own browser suite.
 */

import { createLogger, type LogProcessor } from '@holz/core';
import { defineOption, updateConfig } from '@lib/runtime-config';

import { createConfigFilter } from '../config-filter';

/** A pattern option whose `development` default is `pattern`. */
const patternOption = (id: string, pattern: string) =>
  defineOption<{ pattern: string }>(id, {
    development: { pattern },
    staging: { pattern: '' },
    production: { pattern: '' },
  });

/** Let the async pattern read (and any channel delivery) settle. */
const settle = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve));

interface Harness {
  /** Messages that passed the filter, in arrival order. */
  passed: string[];
  logger: ReturnType<typeof createLogger>;
}

const setup = (option: ReturnType<typeof patternOption>): Harness => {
  const passed: string[] = [];
  const processor: LogProcessor = (log) => void passed.push(log.message);
  const logger = createLogger(createConfigFilter({ option, processor }));
  return { passed, logger };
};

describe('createConfigFilter', () => {
  it('buffers logs until the pattern resolves, then drains them', async () => {
    const { passed, logger } = setup(patternOption('drains', '*'));

    // Emitted before the async read resolves — held in the valve.
    logger.info('early');
    expect(passed).toEqual([]);

    await settle();
    expect(passed).toEqual(['early']);

    // Streams straight through once open.
    logger.info('late');
    expect(passed).toEqual(['early', 'late']);
  });

  it('forwards only logs whose origin matches the resolved pattern', async () => {
    const { passed, logger } = setup(patternOption('matches', 'allowed*'));
    await settle();

    logger.namespace('allowed').info('yes');
    logger.namespace('blocked').info('no');

    expect(passed).toEqual(['yes']);
  });

  it('drops everything when the resolved pattern is empty', async () => {
    const { passed, logger } = setup(patternOption('empty', ''));
    await settle();

    logger.namespace('anything').info('nope');

    expect(passed).toEqual([]);
  });

  it('swaps the pattern when the option changes', async () => {
    const option = patternOption('reacts', '');
    const { passed, logger } = setup(option);
    await settle();

    logger.namespace('feature').info('before');
    expect(passed).toEqual([]);

    // Widen the pattern to match `feature`. `subscribe` publishes to self, so
    // this same-context write reaches the filter.
    await updateConfig(option, { development: { pattern: 'feature*' } });
    await settle();

    logger.namespace('feature').info('after');
    expect(passed).toEqual(['after']);
  });
});
