import { createTestController } from '@lib/effects/testing';
import { sendMessage } from '../../platform/iroh';
import { shareMessage } from '../../protocol';
import {
  $draftChanged,
  $drafts,
  $peerLinked,
  $shareLog,
  $shareQueued,
} from '../../state';
import { $flushShares, $receiveShare, $shareText } from '../shares';
import { PEER_ID, fakeLink } from './fixtures';

vi.mock('../../platform/iroh', () => ({ sendMessage: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sendMessage).mockResolvedValue(true);
  vi.spyOn(Date, 'now').mockReturnValue(5_000);

  let next = 0;
  vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
    next += 1;
    return `0000000${next}-0000-0000-0000-000000000000`;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const queue = (body: string, id: string) => ({
  id,
  endpointId: PEER_ID,
  body,
  at: 1,
});

describe('$flushShares', () => {
  it('sends the peer’s queued shares in order and marks them sent', async () => {
    await using effects = createTestController();
    const shareQueued = await effects.run($shareQueued);
    const flushShares = await effects.run($flushShares);
    const log = await effects.run($shareLog);
    const link = fakeLink();
    shareQueued(queue('one', 'a'));
    shareQueued(queue('two', 'b'));

    await flushShares(link);

    expect(vi.mocked(sendMessage).mock.calls).toEqual([
      [link, shareMessage('one')],
      [link, shareMessage('two')],
    ]);
    expect(log.items.map((share) => share.status)).toEqual(['sent', 'sent']);
  });

  it('leaves other peers’ shares alone', async () => {
    await using effects = createTestController();
    const shareQueued = await effects.run($shareQueued);
    const flushShares = await effects.run($flushShares);
    shareQueued({ ...queue('elsewhere', 'a'), endpointId: 'someone-else' });

    await flushShares(fakeLink());

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('stops at the first send that doesn’t land', async () => {
    vi.mocked(sendMessage).mockResolvedValue(false);
    await using effects = createTestController();
    const shareQueued = await effects.run($shareQueued);
    const flushShares = await effects.run($flushShares);
    const log = await effects.run($shareLog);
    shareQueued(queue('one', 'a'));
    shareQueued(queue('two', 'b'));

    await flushShares(fakeLink());

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(log.items.map((share) => share.status)).toEqual([
      'queued',
      'queued',
    ]);
  });
});

describe('$receiveShare', () => {
  it('logs what the peer sent', async () => {
    await using effects = createTestController();
    const receiveShare = await effects.run($receiveShare);
    const log = await effects.run($shareLog);

    receiveShare(PEER_ID, 'hello');

    expect(log.items).toEqual([
      {
        id: '00000001-0000-0000-0000-000000000000',
        endpointId: PEER_ID,
        body: 'hello',
        status: 'received',
        at: 5_000,
      },
    ]);
  });
});

describe('$shareText', () => {
  it('queues the share and clears the draft', async () => {
    await using effects = createTestController();
    const draftChanged = await effects.run($draftChanged);
    const shareText = await effects.run($shareText);
    const log = await effects.run($shareLog);
    const drafts = await effects.run($drafts);
    draftChanged(PEER_ID, 'hello');

    await shareText(PEER_ID, 'hello');

    expect(log.items).toMatchObject([{ body: 'hello', status: 'queued' }]);
    expect(drafts.bodies).toEqual({});
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('sends straight away to a linked peer', async () => {
    await using effects = createTestController();
    const peerLinked = await effects.run($peerLinked);
    const shareText = await effects.run($shareText);
    const log = await effects.run($shareLog);
    const link = fakeLink();
    peerLinked(link);

    await shareText(PEER_ID, 'hello');

    expect(sendMessage).toHaveBeenCalledWith(link, shareMessage('hello'));
    expect(log.items).toMatchObject([{ status: 'sent' }]);
  });

  it('drops a body with nothing in it', async () => {
    await using effects = createTestController();
    const draftChanged = await effects.run($draftChanged);
    const shareText = await effects.run($shareText);
    const log = await effects.run($shareLog);
    const drafts = await effects.run($drafts);
    draftChanged(PEER_ID, '   ');

    await shareText(PEER_ID, '   ');

    expect(log.items).toEqual([]);
    expect(drafts.bodies).toEqual({ [PEER_ID]: '   ' });
  });
});
