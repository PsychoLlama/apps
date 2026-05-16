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

  it('tags logs with each scope segment as an origin entry', () => {
    const logs = captureLogs();

    createLogger(['@lib/observability', 'create-logger']).info('hello');

    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('hello');
    expect(logs[0].origin).toEqual(['@lib/observability', 'create-logger']);
  });

  it('extends origin via .namespace()', () => {
    const logs = captureLogs();

    createLogger(['@lib/observability']).namespace('subsystem').warn('uh oh');

    expect(logs[0].origin).toEqual(['@lib/observability', 'subsystem']);
    expect(logs[0].level).toBe(40);
  });

  it('forwards structured context', () => {
    const logs = captureLogs();

    createLogger(['@lib/observability']).error('boom', { userId: 42 });

    expect(logs[0].context).toEqual({ userId: 42 });
  });
});
