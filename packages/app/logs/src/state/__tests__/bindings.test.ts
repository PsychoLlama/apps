/**
 * Unit tests for the archive's freshness transitions — the state driving the
 * header's refresh action. The store never dereferences the held connection, so
 * these stand in a fake one and exercise the actions directly.
 */

import { createTestBindings } from '@lib/state';
import type { LogConnection } from '@lib/holz-idb-backend/database';
import { logsStore } from '../store';
import { setLogs, markLogsStale } from '../bindings';

/** A stand-in connection — the freshness actions only ever hold it, never call it. */
const fakeConnection = {} as LogConnection;

const setup = () => {
  const bindings = createTestBindings();
  const logs = bindings.createStore(logsStore);
  return { ...bindings, logs };
};

it('seeds freshness as initial before any read', () => {
  const { logs } = setup();
  expect(logs.freshness).toBe('initial');
});

it('marks the archive current when a read lands', () => {
  const { logs, useAction } = setup();

  useAction(setLogs)({ db: fakeConnection, entries: [] });

  expect(logs.freshness).toBe('current');
});

it('flips a current archive to stale on a ping', () => {
  const { logs, useAction } = setup();
  useAction(setLogs)({ db: fakeConnection, entries: [] });

  useAction(markLogsStale)();

  expect(logs.freshness).toBe('stale');
});

it('ignores pings before the first read lands', () => {
  const { logs, useAction } = setup();

  // No baseline yet — the in-flight read will show whatever's there, so a ping
  // has nothing to invalidate.
  useAction(markLogsStale)();

  expect(logs.freshness).toBe('initial');
});

it('re-reads land the archive back at current', () => {
  const { logs, useAction } = setup();
  useAction(setLogs)({ db: fakeConnection, entries: [] });
  useAction(markLogsStale)();

  // A fresh read supersedes the stale flag.
  useAction(setLogs)({ db: fakeConnection, entries: [] });

  expect(logs.freshness).toBe('current');
});
