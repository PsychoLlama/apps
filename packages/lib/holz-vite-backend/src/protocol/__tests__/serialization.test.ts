import { type Log, type Logger, createLogger } from '@holz/core';
import {
  type SerializedLog,
  deserializeLog,
  serializeLog,
} from '../serialization.ts';

// Logs are produced by a real holz logger so the tests see the same shapes
// the client backend does.
const capture = (emit: (logger: Logger) => void): Log => {
  const logs: Log[] = [];
  emit(createLogger((log) => logs.push(log)).namespace('app'));

  return logs[0];
};

// Simulates the trip over the Vite socket.
const overTheWire = (log: Log) =>
  deserializeLog(
    JSON.parse(JSON.stringify(serializeLog(log))) as SerializedLog,
  );

describe('serializeLog', () => {
  it('passes JSON context through untouched', () => {
    const log = capture((logger) =>
      logger.info('hello', { user: 'alice', count: 3, tags: ['a', 'b'] }),
    );

    expect(serializeLog(log)).toEqual(log);
  });

  it('converts the context error to a plain object', () => {
    const error = new TypeError('boom');
    const log = capture((logger) => logger.error('failed', { error }));
    const { context } = serializeLog(log);

    expect(context.error).not.toBeInstanceOf(Error);
    expect(context.error).toMatchObject({
      name: 'TypeError',
      message: 'boom',
      stack: error.stack,
    });
  });

  it('omits the error key when there is no error', () => {
    const log = capture((logger) => logger.info('hello'));

    expect(serializeLog(log).context).not.toHaveProperty('error');
  });
});

describe('deserializeLog', () => {
  it('round-trips a log without an error', () => {
    const log = capture((logger) =>
      logger.info('hello', { user: 'alice', nested: { ok: true } }),
    );

    expect(overTheWire(log)).toEqual(log);
  });

  it('hydrates the context error back into an Error instance', () => {
    const cause = new Error('root cause');
    const error = new RangeError('boom', { cause });
    const log = capture((logger) =>
      logger.error('failed', { error, user: 'alice' }),
    );
    const { context } = overTheWire(log);

    expect(context.user).toBe('alice');
    expect(context.error).toBeInstanceOf(RangeError);
    expect(context.error).toMatchObject({
      message: 'boom',
      stack: error.stack,
    });
    expect(context.error?.cause).toBeInstanceOf(Error);
    expect(context.error?.cause).toMatchObject({ message: 'root cause' });
  });
});
