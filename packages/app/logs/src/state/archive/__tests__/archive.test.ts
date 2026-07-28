/**
 * Fold tests for the archive: commit a fact, assert the state it lands. No
 * sagas and no capabilities are involved — what publishes each fact is covered
 * by the saga tests. The store never dereferences the connection it holds, so
 * these stand in a fake one.
 */

import { createTestRuntime } from '@lib/state-next';
import { level, type Log } from '@lib/observability';
import type { LogConnection } from '@lib/holz-idb-backend/database';
import {
  archiveLoadFailedTopic,
  archiveLoadedTopic,
  archiveRefreshedTopic,
  archiveStore,
  connectionCell,
  logsInsertedTopic,
} from '../archive';
import { logsScope } from '../../scope';

/** A stand-in connection — the folds only ever hold it, never call it. */
const fakeConnection = { close: () => {} } as unknown as LogConnection;

/** A complete `Log`, with only the fields a test cares about overridden. */
const makeLog = (overrides: Partial<Log>): Log => ({
  timestamp: 0,
  message: '',
  level: level.info,
  origin: [],
  context: {},
  ...overrides,
});

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(logsScope);
  return runtime;
};

describe('archiveStore', () => {
  it('starts on the skeleton state, with nothing to compare against', () => {
    const { peek } = setup();

    // Prerender and the client's first paint both land here: IndexedDB is
    // client-only, so there's nothing read back yet to show or measure against.
    expect(peek(archiveStore)).toEqual({
      status: 'loading',
      freshness: 'initial',
      entries: [],
    });
    expect(peek(connectionCell)).toBeNull();
  });
});

describe('archiveLoadedTopic', () => {
  it('lands the snapshot and holds the connection it came through', () => {
    const { commit, peek } = setup();
    const entry = makeLog({ message: 'read', timestamp: 1000 });

    commit(archiveLoadedTopic({ db: fakeConnection, entries: [entry] }));

    expect(peek(archiveStore)).toEqual({
      status: 'ready',
      freshness: 'current',
      entries: [entry],
    });
    expect(peek(connectionCell)).toBe(fakeConnection);
  });

  it('lands the archive back at current on a re-read', () => {
    const { commit, peek } = setup();
    commit(archiveLoadedTopic({ db: fakeConnection, entries: [] }));
    commit(logsInsertedTopic());

    // A fresh read supersedes the stale flag.
    commit(archiveLoadedTopic({ db: fakeConnection, entries: [] }));

    expect(peek(archiveStore).freshness).toBe('current');
  });
});

describe('archiveLoadFailedTopic', () => {
  it('drops to the error state rather than spinning on the skeleton', () => {
    const { commit, peek } = setup();

    commit(archiveLoadFailedTopic());

    expect(peek(archiveStore).status).toBe('error');
    expect(peek(archiveStore).entries).toEqual([]);
  });
});

describe('logsInsertedTopic', () => {
  it('flips a current archive to stale on a ping', () => {
    const { commit, peek } = setup();
    commit(archiveLoadedTopic({ db: fakeConnection, entries: [] }));

    commit(logsInsertedTopic());

    expect(peek(archiveStore).freshness).toBe('stale');
  });

  it('ignores pings before the first read lands', () => {
    const { commit, peek } = setup();

    // No baseline yet — the in-flight read will show whatever's there, so a
    // ping has nothing to invalidate.
    commit(logsInsertedTopic());

    expect(peek(archiveStore).freshness).toBe('initial');
  });
});

describe('archiveRefreshedTopic', () => {
  it('prepends refreshed logs ahead of the held snapshot', () => {
    const { commit, peek } = setup();
    const held = makeLog({ message: 'held', timestamp: 1000 });
    commit(archiveLoadedTopic({ db: fakeConnection, entries: [held] }));
    commit(logsInsertedTopic());

    // The refresh reads only the newer tail; it lands ahead of the snapshot so
    // the merged list stays newest-first.
    const added = makeLog({ message: 'added', timestamp: 2000 });
    commit(archiveRefreshedTopic([added]));

    expect(peek(archiveStore).freshness).toBe('current');
    expect(peek(archiveStore).entries.map((log) => log.message)).toEqual([
      'added',
      'held',
    ]);
  });

  it('settles freshness to current when a refresh adds nothing', () => {
    const { commit, peek } = setup();
    const held = makeLog({ message: 'held', timestamp: 1000 });
    commit(archiveLoadedTopic({ db: fakeConnection, entries: [held] }));
    commit(logsInsertedTopic());

    // An empty delta still confirms the view is current, and leaves entries be.
    commit(archiveRefreshedTopic([]));

    expect(peek(archiveStore).freshness).toBe('current');
    expect(peek(archiveStore).entries.map((log) => log.message)).toEqual([
      'held',
    ]);
  });
});
