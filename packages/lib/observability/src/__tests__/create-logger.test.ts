import type { Log } from '@holz/core';
import {
  createLogger,
  setGlobalLogCollector,
  unsetGlobalLogCollector,
} from '../index';

const captureLogs = (): Log[] => {
  const logs: Log[] = [];
  setGlobalLogCollector({
    processor: (log) => {
      logs.push(log);
    },
  });
  return logs;
};

describe('createLogger', () => {
  afterEach(() => {
    unsetGlobalLogCollector();
  });

  it('tags logs with the supplied owner', () => {
    const logs = captureLogs();

    createLogger('observability-test').info('hello');

    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('hello');
    expect(logs[0].origin).toEqual(['observability-test']);
  });

  it('extends origin via .namespace()', () => {
    const logs = captureLogs();

    createLogger('observability-test').namespace('subsystem').warn('uh oh');

    expect(logs[0].origin).toEqual(['observability-test', 'subsystem']);
    expect(logs[0].level).toBe(40);
  });

  it('forwards structured context', () => {
    const logs = captureLogs();

    createLogger('observability-test').error('boom', { userId: 42 });

    expect(logs[0].context).toEqual({ userId: 42 });
  });
});
