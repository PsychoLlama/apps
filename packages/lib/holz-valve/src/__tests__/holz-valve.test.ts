/**
 * Behavioral tests for the log valve. Logs are driven through a real
 * `@holz/core` logger so the tests exercise the production path:
 * `logger.info(...)` → valve → downstream processor.
 */

import { createLogger, type Logger, type LogProcessor } from '@holz/core';

import { createLogValve, type LogValve } from '../holz-valve';

interface Harness {
  /** Messages that reached the downstream processor, in arrival order. */
  forwarded: string[];
  valve: LogValve;
  logger: Logger;
}

/** Wire a valve to a recording processor behind a real logger. */
const setup = ({ capacity }: { capacity: number }): Harness => {
  const forwarded: string[] = [];
  const processor: LogProcessor = (log) => void forwarded.push(log.message);
  const valve = createLogValve({ capacity, processor });
  const logger = createLogger(valve.processor);
  return { forwarded, valve, logger };
};

describe('createLogValve', () => {
  it('streams logs straight through while open (the default)', () => {
    const { forwarded, logger } = setup({ capacity: 10 });

    logger.info('a');
    logger.info('b');

    expect(forwarded).toEqual(['a', 'b']);
  });

  it('queues logs while closed, forwarding nothing', () => {
    const { forwarded, valve, logger } = setup({ capacity: 10 });

    valve.close();
    logger.info('a');
    logger.info('b');

    expect(forwarded).toEqual([]);
  });

  it('flushes queued logs in arrival order when reopened, then streams', () => {
    const { forwarded, valve, logger } = setup({ capacity: 10 });

    valve.close();
    logger.info('a');
    logger.info('b');
    expect(forwarded).toEqual([]);

    valve.open();
    expect(forwarded).toEqual(['a', 'b']);

    logger.info('c');
    expect(forwarded).toEqual(['a', 'b', 'c']);
  });

  it('drops the oldest logs once the buffer is full', () => {
    const { forwarded, valve, logger } = setup({ capacity: 2 });

    valve.close();
    logger.info('a');
    logger.info('b');
    logger.info('c');
    logger.info('d');
    valve.open();

    expect(forwarded).toEqual(['c', 'd']);
  });

  it('keeps nothing while closed when capacity is zero', () => {
    const { forwarded, valve, logger } = setup({ capacity: 0 });

    valve.close();
    logger.info('a');
    logger.info('b');
    valve.open();
    expect(forwarded).toEqual([]);

    logger.info('c');
    expect(forwarded).toEqual(['c']);
  });

  it('wraps the ring buffer, keeping only the newest within capacity', () => {
    const { forwarded, valve, logger } = setup({ capacity: 3 });

    valve.close();
    // Push past capacity so the write head wraps and overwrites the oldest.
    for (const message of ['a', 'b', 'c', 'd', 'e']) {
      logger.info(message);
    }
    valve.open();

    expect(forwarded).toEqual(['c', 'd', 'e']);
  });

  it('buffers without bound at the default (Infinity) capacity', () => {
    const { forwarded, valve, logger } = setup({ capacity: Infinity });
    const messages = Array.from(Array(200).keys(), (index) => `log-${index}`);

    valve.close();
    for (const message of messages) {
      logger.info(message);
    }
    valve.open();

    expect(forwarded).toEqual(messages);
  });

  it('streams a re-entrant log cleanly during a flush', () => {
    const forwarded: string[] = [];
    let reentered = false;

    // `processor` only reads `logger` when invoked (during the flush below),
    // by which point the `const` is initialized.
    const processor: LogProcessor = (log) => {
      forwarded.push(log.message);
      if (log.message === 'b' && !reentered) {
        reentered = true;
        logger.info('reentrant');
      }
    };

    const valve = createLogValve({ capacity: 10, processor });
    const logger = createLogger(valve.processor);

    valve.close();
    logger.info('a');
    logger.info('b');
    logger.info('c');
    valve.open();

    // 'reentrant' is logged while flushing 'b'. Since the valve is already
    // open by then, it streams straight through rather than re-queuing.
    expect(forwarded).toEqual(['a', 'b', 'reentrant', 'c']);
  });

  it('treats redundant open/close calls as no-ops', () => {
    const { forwarded, valve, logger } = setup({ capacity: 10 });

    valve.open(); // already open
    logger.info('a');
    valve.close();
    valve.close(); // already closed
    logger.info('b');

    expect(forwarded).toEqual(['a']);
  });
});
