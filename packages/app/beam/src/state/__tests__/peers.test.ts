/** Unit tests for peer links: their bookkeeping, and how each one reads. */

import { createTestController } from '@lib/effects/testing';
import type { PeerLink } from '../../platform/iroh';
import { createInbox } from '../../platform/inbox';
import type { BeamMessage } from '../../protocol';
import {
  $peerClosed,
  $peerDialing,
  $peerHandles,
  $peerLinked,
  $peerLinks,
  $peerReleased,
  $peerUnreachable,
  activePeersOf,
  peerStateOf,
  type PeerLinkStatus,
} from '../peers';

const fakeLink = (endpointId = 'ep-1'): PeerLink => ({
  endpointId,
  messages: createInbox<BeamMessage>(),
  closed: new Promise(() => {}),
  send: () => Promise.resolve(),
  release: () => {},
});

const setup = async (effects: ReturnType<typeof createTestController>) => ({
  links: await effects.run($peerLinks),
  handles: await effects.run($peerHandles),
  peerDialing: await effects.run($peerDialing),
  peerLinked: await effects.run($peerLinked),
  peerUnreachable: await effects.run($peerUnreachable),
  peerClosed: await effects.run($peerClosed),
  peerReleased: await effects.run($peerReleased),
});

describe('$peerDialing', () => {
  it('marks the dial in flight', async () => {
    await using effects = createTestController();
    const { links, peerDialing } = await setup(effects);

    peerDialing('ep-1');

    expect(links.statuses).toEqual({ 'ep-1': 'dialing' });
  });
});

describe('$peerLinked', () => {
  it('marks the peer linked and holds its handle', async () => {
    await using effects = createTestController();
    const { links, handles, peerLinked } = await setup(effects);
    const link = fakeLink();

    peerLinked(link);

    expect(links.statuses['ep-1']).toBe('linked');
    expect(handles().get('ep-1')).toBe(link);
  });

  it('replaces the map rather than mutating it', async () => {
    await using effects = createTestController();
    const { handles, peerLinked } = await setup(effects);
    const before = handles();

    peerLinked(fakeLink());

    expect(handles()).not.toBe(before);
    expect(before.size).toBe(0);
  });
});

describe('$peerUnreachable', () => {
  it('marks a dial that didn’t land', async () => {
    await using effects = createTestController();
    const { links, peerDialing, peerUnreachable } = await setup(effects);

    peerDialing('ep-1');
    peerUnreachable('ep-1');

    expect(links.statuses['ep-1']).toBe('unreachable');
  });
});

describe('$peerClosed', () => {
  it('closes the link being held', async () => {
    await using effects = createTestController();
    const { links, handles, peerLinked, peerClosed } = await setup(effects);
    const link = fakeLink();

    peerLinked(link);
    peerClosed(link);

    expect(links.statuses['ep-1']).toBe('closed');
    expect(handles().has('ep-1')).toBe(false);
  });

  it('ignores a link that was already replaced', async () => {
    await using effects = createTestController();
    const { links, handles, peerLinked, peerClosed } = await setup(effects);
    const stale = fakeLink();
    const current = fakeLink();

    peerLinked(stale);
    peerLinked(current);
    peerClosed(stale);

    expect(links.statuses['ep-1']).toBe('linked');
    expect(handles().get('ep-1')).toBe(current);
  });

  it('ignores a link that was released first', async () => {
    await using effects = createTestController();
    const { links, peerLinked, peerReleased, peerClosed } =
      await setup(effects);
    const link = fakeLink();

    peerLinked(link);
    peerReleased('ep-1');
    peerClosed(link);

    expect(links.statuses).toEqual({});
  });
});

describe('$peerReleased', () => {
  it('drops the status and the handle', async () => {
    await using effects = createTestController();
    const { links, handles, peerLinked, peerReleased } = await setup(effects);

    peerLinked(fakeLink());
    peerReleased('ep-1');

    expect(links.statuses).toEqual({});
    expect(handles().size).toBe(0);
  });
});

describe('activePeersOf', () => {
  it('is empty before anything dials', () => {
    expect(activePeersOf({ statuses: {} })).toEqual({});
  });

  it('lists only the linked peers', () => {
    const statuses = {
      'ep-1': 'linked',
      'ep-2': 'dialing',
      'ep-3': 'closed',
      'ep-4': 'unreachable',
    } as const;

    expect(activePeersOf({ statuses })).toEqual({ 'ep-1': true });
  });
});

describe('peerStateOf', () => {
  it.each([
    [undefined, 'preparing'],
    ['dialing', 'connecting'],
    ['linked', 'connected'],
    ['unreachable', 'unreachable'],
    ['closed', 'disconnected'],
  ] as const)('reads %s as %s', (status, state) => {
    const statuses: Record<string, PeerLinkStatus> = status
      ? { 'ep-1': status }
      : {};

    expect(peerStateOf({ statuses }, 'ep-1')).toBe(state);
  });
});
