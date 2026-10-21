/** Unit tests for the share log, the composer's drafts, and their grouping. */

import { createTestController } from '@lib/effects/testing';
import {
  $draftChanged,
  $drafts,
  $shareLog,
  $shareQueued,
  $shareReceived,
  $shareSent,
  SHARE_LOG_LIMIT,
  sharesByPeerOf,
  type Share,
  type ShareEntry,
} from '../shares';

const entry = (overrides: Partial<ShareEntry> = {}): ShareEntry => ({
  id: 's1',
  endpointId: 'ep-1',
  body: 'hello',
  at: 1,
  ...overrides,
});

const share = (overrides: Partial<Share> = {}): Share => ({
  ...entry(),
  status: 'sent',
  ...overrides,
});

describe('$shareQueued', () => {
  it('queues the share', async () => {
    await using effects = createTestController();
    const log = await effects.run($shareLog);
    const shareQueued = await effects.run($shareQueued);

    shareQueued(entry());

    expect(log.items).toEqual([share({ status: 'queued' })]);
  });

  it('normalizes the body on the way in', async () => {
    await using effects = createTestController();
    const log = await effects.run($shareLog);
    const shareQueued = await effects.run($shareQueued);

    shareQueued(entry({ body: '  hello\u0000  ' }));

    expect(log.items[0]?.body).toBe('hello');
  });

  it('drops a body with nothing in it', async () => {
    await using effects = createTestController();
    const log = await effects.run($shareLog);
    const shareQueued = await effects.run($shareQueued);

    shareQueued(entry({ body: '   ' }));

    expect(log.items).toEqual([]);
  });

  it('clears the peer’s draft in the same commit', async () => {
    await using effects = createTestController();
    const drafts = await effects.run($drafts);
    const draftChanged = await effects.run($draftChanged);
    const shareQueued = await effects.run($shareQueued);
    draftChanged('ep-1', 'hello');
    draftChanged('ep-2', 'other');

    shareQueued(entry());

    expect(drafts.bodies).toEqual({ 'ep-2': 'other' });
  });

  it('drops the oldest once the log is full', async () => {
    await using effects = createTestController();
    const log = await effects.run($shareLog);
    const shareQueued = await effects.run($shareQueued);

    for (let index = 0; index <= SHARE_LOG_LIMIT; index += 1) {
      shareQueued(entry({ id: `s${index}` }));
    }

    expect(log.items).toHaveLength(SHARE_LOG_LIMIT);
    expect(log.items[0]?.id).toBe('s1');
  });
});

describe('$shareSent', () => {
  it('marks a queued share sent', async () => {
    await using effects = createTestController();
    const log = await effects.run($shareLog);
    const shareQueued = await effects.run($shareQueued);
    const shareSent = await effects.run($shareSent);

    shareQueued(entry());
    shareSent('s1');

    expect(log.items[0]?.status).toBe('sent');
  });

  it('ignores a share that isn’t there', async () => {
    await using effects = createTestController();
    const log = await effects.run($shareLog);
    const shareSent = await effects.run($shareSent);

    shareSent('s9');

    expect(log.items).toEqual([]);
  });
});

describe('$shareReceived', () => {
  it('logs what a peer shared', async () => {
    await using effects = createTestController();
    const log = await effects.run($shareLog);
    const shareReceived = await effects.run($shareReceived);

    shareReceived(entry());

    expect(log.items).toEqual([share({ status: 'received' })]);
  });

  it('drops a body with nothing in it', async () => {
    await using effects = createTestController();
    const log = await effects.run($shareLog);
    const shareReceived = await effects.run($shareReceived);

    shareReceived(entry({ body: '\n\t' }));

    expect(log.items).toEqual([]);
  });
});

describe('$draftChanged', () => {
  it('holds a draft per peer', async () => {
    await using effects = createTestController();
    const drafts = await effects.run($drafts);
    const draftChanged = await effects.run($draftChanged);

    draftChanged('ep-1', 'one');
    draftChanged('ep-2', 'two');

    expect(drafts.bodies).toEqual({ 'ep-1': 'one', 'ep-2': 'two' });
  });
});

describe('sharesByPeerOf', () => {
  it('is empty before anything is shared', () => {
    expect(sharesByPeerOf({ items: [] })).toEqual({});
  });

  it('groups by peer, newest first', () => {
    const items = [
      share({ id: 's1', endpointId: 'ep-1' }),
      share({ id: 's2', endpointId: 'ep-2' }),
      share({ id: 's3', endpointId: 'ep-1' }),
    ];

    const grouped = sharesByPeerOf({ items });

    expect(grouped['ep-1']?.map((item) => item.id)).toEqual(['s3', 's1']);
    expect(grouped['ep-2']?.map((item) => item.id)).toEqual(['s2']);
  });
});
