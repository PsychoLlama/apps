/**
 * Saga tests for the archive. `trackArchiveSaga` gets both treatments:
 * `simulate` for the facts it publishes and their order, a test runtime for
 * the state they land on. Every stubbed insert stream here runs dry, which is
 * what lets the saga return; the real one only ends when the scope dies.
 */

import { AbortError, createTestRuntime, simulate } from '@lib/state';
import { level, type Log } from '@lib/observability';
import type { LogConnection } from '@lib/holz-idb-backend/database';
import {
  archiveLoadFailedTopic,
  archiveLoadedTopic,
  archiveRefreshedTopic,
  archiveStore,
  connectionCell,
  logsInsertedTopic,
  type LoadedArchive,
} from '../archive';
import {
  loadArchive,
  nextLogInsert,
  readNewLogs,
  watchLogInserts,
} from '../capabilities';
import { refreshArchiveSaga, trackArchiveSaga } from '../sagas';
import { logsScope } from '../../scope';

/** A stand-in connection — the sagas only ever pass it along. */
const fakeConnection = { close: () => {} } as unknown as LogConnection;

/** A stand-in insert stream; every pull through it is stubbed. */
const fakeInserts = {} as AsyncGenerator<void>;

/** A complete `Log`, with only the fields a test cares about overridden. */
const makeLog = (overrides: Partial<Log>): Log => ({
  timestamp: 0,
  message: '',
  level: level.info,
  origin: [],
  context: {},
  ...overrides,
});

const loaded: LoadedArchive = {
  db: fakeConnection,
  entries: [makeLog({ message: 'read', timestamp: 1000 })],
};

/** A stubbed pull that reports `count` pings and then runs dry. */
const pings = (count: number): (() => boolean) => {
  let remaining = count;
  return () => remaining-- > 0;
};

describe('trackArchiveSaga', () => {
  it('opens the insert subscription before it reads', async () => {
    const order: string[] = [];

    await simulate(trackArchiveSaga(), {
      reads: [[connectionCell, null]],
      calls: [
        [
          watchLogInserts,
          () => {
            order.push('watch');
            return fakeInserts;
          },
        ],
        [
          loadArchive,
          () => {
            order.push('read');
            return loaded;
          },
        ],
        [nextLogInsert, pings(0)],
      ],
    });

    // Subscribing first is what keeps a ping landing mid-read from being lost
    // rather than buffered.
    expect(order).toEqual(['watch', 'read']);
  });

  it('publishes the snapshot before any later ping', async () => {
    const trace = await simulate(trackArchiveSaga(), {
      reads: [[connectionCell, null]],
      calls: [
        [watchLogInserts, () => fakeInserts],
        [loadArchive, () => loaded],
        [nextLogInsert, pings(2)],
      ],
    });

    expect(trace.commits).toEqual([
      [archiveLoadedTopic(loaded)],
      [logsInsertedTopic()],
      [logsInsertedTopic()],
    ]);
  });

  it('publishes a failed read instead of a snapshot', async () => {
    const trace = await simulate(trackArchiveSaga(), {
      reads: [[connectionCell, null]],
      calls: [
        [watchLogInserts, () => fakeInserts],
        [
          loadArchive,
          () => {
            throw new Error('the archive is unreadable');
          },
        ],
        [nextLogInsert, pings(0)],
      ],
    });

    expect(trace.commits).toEqual([[archiveLoadFailedTopic()]]);
  });

  it('lets teardown through rather than calling it a failed read', async () => {
    const run = simulate(trackArchiveSaga(), {
      reads: [[connectionCell, null]],
      calls: [
        [watchLogInserts, () => fakeInserts],
        [
          loadArchive,
          () => {
            throw new AbortError();
          },
        ],
      ],
    });

    // The scope is going away, so there's nobody left to show an error state
    // to — and the view it would land on is about to be deallocated.
    await expect(run).rejects.toThrow(AbortError);
  });

  it('leaves a connection that is already held alone', async () => {
    const trace = await simulate(trackArchiveSaga(), {
      reads: [[connectionCell, fakeConnection]],
    });

    // A second anchor opening a second connection would silently drop the
    // first, unclosed. No stubs are needed because nothing else runs.
    expect(trace.commits).toEqual([]);
  });

  it('replays a ping that landed mid-read on top of the snapshot', async () => {
    const runtime = createTestRuntime({
      calls: [
        [watchLogInserts, () => fakeInserts],
        [loadArchive, () => loaded],
        [nextLogInsert, pings(1)],
      ],
    });
    runtime.anchor(logsScope);

    await runtime.run(trackArchiveSaga());

    // The stream is pulled after the snapshot lands, so the buffered ping
    // flags the view stale rather than hitting the `initial` state that
    // ignores it.
    expect(runtime.peek(archiveStore).freshness).toBe('stale');
    expect(runtime.peek(connectionCell)).toBe(fakeConnection);
  });
});

describe('refreshArchiveSaga', () => {
  /** Record what the refresh read was pointed at, and answer with `added`. */
  const readSpy = (added: Log[]) => {
    const calls: unknown[][] = [];
    const read = (_signal: AbortSignal, ...args: unknown[]) => {
      calls.push(args);
      return added;
    };

    return { calls, read };
  };

  it('reads forward from the newest entry shown', async () => {
    const added = [makeLog({ message: 'added', timestamp: 2000 })];
    const { calls, read } = readSpy(added);

    const trace = await simulate(refreshArchiveSaga(), {
      reads: [
        [connectionCell, fakeConnection],
        [archiveStore, { entries: loaded.entries }],
      ],
      calls: [[readNewLogs, read]],
    });

    // `entries` is newest-first, so the head is the floor to read forward from.
    expect(calls).toEqual([[fakeConnection, 1000]]);
    expect(trace.commits).toEqual([[archiveRefreshedTopic(added)]]);
  });

  it('falls back to the whole archive when nothing is shown yet', async () => {
    const { calls, read } = readSpy([]);

    await simulate(refreshArchiveSaga(), {
      reads: [
        [connectionCell, fakeConnection],
        [archiveStore, { entries: [] }],
      ],
      calls: [[readNewLogs, read]],
    });

    expect(calls).toEqual([[fakeConnection, undefined]]);
  });

  it('keeps the snapshot when the refresh fails', async () => {
    const trace = await simulate(refreshArchiveSaga(), {
      reads: [
        [connectionCell, fakeConnection],
        [archiveStore, { entries: [] }],
      ],
      calls: [
        [
          readNewLogs,
          () => {
            throw new Error('the read failed');
          },
        ],
      ],
    });

    // The viewer stays stale with what it has, so the action can be retried.
    expect(trace.commits).toEqual([]);
  });
});
