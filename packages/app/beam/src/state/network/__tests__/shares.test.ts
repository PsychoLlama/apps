/**
 * Unit tests for moving shares across a link: what gets queued, what actually
 * goes out, and what is refused on the way in. Simulated, so the assertions
 * are about what each saga published and handed to the transport.
 */

import { simulate } from '@lib/state';
import { sendMessage } from '../../platform/iroh';
import { shareMessage } from '../../platform/protocol';
import { newShareId, now } from '../../platform/host';
import { peerHandlesCell } from '../peers';
import { contactsStore } from '../../contacts';
import {
  draftClearedTopic,
  shareLogStore,
  shareQueuedTopic,
  shareReceivedTopic,
  shareSentTopic,
} from '../../shares';
import {
  flushSharesSaga,
  receiveShareSaga,
  shareTextSaga,
} from '../sagas/shares';
import type { PeerConnection } from '@crate/p2p';
import type { PeerLink } from '../../platform/iroh';
import { createInbox } from '../../platform/inbox';
import type { Contact } from '../../platform/database';
import type { Share } from '../../shares';

const PEER_ID = `e2${'0'.repeat(62)}`;

/**
 * A stand-in peer link, already listening — which is what a real one is by
 * the time a saga sees it. Everything done to one goes through a capability.
 */
const fakeLink = (endpointId = PEER_ID): PeerLink => ({
  endpointId,
  connection: {} as PeerConnection,
  messages: createInbox(),
  closed: new Promise(() => undefined),
  release: () => undefined,
});

const fakeContact = (overrides: Partial<Contact> = {}): Contact => ({
  kind: 'peer',
  endpointId: PEER_ID,
  label: null,
  suggestedLabel: null,
  trust: 'invited',
  direction: 'outbound',
  createdAt: 1,
  lastSeenAt: 1,
  ...overrides,
});

/** A book holding one contact, as the write-through path reads it back. */
const bookHolding = (...contacts: Contact[]) => ({
  status: 'ready' as const,
  entries: Object.fromEntries(
    contacts.map((contact) => [contact.endpointId, contact]),
  ),
});

const fakeShare = (overrides: Partial<Share> = {}): Share => ({
  id: 'share-1',
  endpointId: PEER_ID,
  body: 'hello',
  status: 'queued',
  at: 1,
  ...overrides,
});

describe('shareTextSaga', () => {
  /** Reads a share makes on its way out to a peer that can't take it yet. */
  const unreachable = () =>
    [
      [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
      [peerHandlesCell, new Map()],
      [shareLogStore, { items: [] }],
    ] as const;

  it('queues the share and clears the draft together', async () => {
    const trace = await simulate(
      shareTextSaga({ endpointId: PEER_ID, body: 'kettle is on' }),
      {
        reads: [...unreachable()],
        calls: [
          [now, () => 1234],
          [newShareId, () => 'share-1'],
        ],
      },
    );

    // One transition: a paint between the two would show an empty field
    // above a log that hasn't gained the row yet.
    expect(trace.commits).toEqual([
      [
        shareQueuedTopic({
          id: 'share-1',
          endpointId: PEER_ID,
          body: 'kettle is on',
          at: 1234,
        }),
        draftClearedTopic(PEER_ID),
      ],
    ]);
  });

  it('says nothing about a body of whitespace', async () => {
    const trace = await simulate(
      shareTextSaga({ endpointId: PEER_ID, body: '   \n  ' }),
      {
        reads: [...unreachable()],
        calls: [
          [now, () => 1234],
          [newShareId, () => 'share-1'],
        ],
      },
    );

    expect(trace.commits).toEqual([]);
  });

  it('sends what it queued when the peer is there', async () => {
    const send = vi.fn(() => true);
    const link = fakeLink();

    const trace = await simulate(
      shareTextSaga({ endpointId: PEER_ID, body: 'kettle is on' }),
      {
        reads: [
          [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
          [peerHandlesCell, new Map([[PEER_ID, link]])],
          [shareLogStore, { items: [fakeShare({ body: 'kettle is on' })] }],
        ],
        calls: [
          [now, () => 1234],
          [newShareId, () => 'share-1'],
          [sendMessage, send],
        ],
      },
    );

    expect(send).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      link,
      shareMessage('kettle is on'),
    );
    expect(trace.commits.at(-1)).toEqual([shareSentTopic('share-1')]);
  });
});

describe('flushSharesSaga', () => {
  /** A flush aimed at the peer every fixture here is about. */
  const flush = () => flushSharesSaga(fakeLink());

  it('holds everything back from a peer that hasn’t accepted', async () => {
    const send = vi.fn(() => true);

    const trace = await simulate(flush(), {
      reads: [
        [contactsStore, bookHolding(fakeContact({ trust: 'invited' }))],
        [shareLogStore, { items: [fakeShare()] }],
      ],
      calls: [[sendMessage, send]],
    });

    // The queue fills from the moment the composer does, which is before the
    // peer has answered. Sending anyway would hand text to a stranger.
    expect(send).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });

  it('sends the queue in the order it was written', async () => {
    const sent: string[] = [];

    const trace = await simulate(flush(), {
      reads: [
        [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
        [
          shareLogStore,
          {
            items: [
              fakeShare({ id: 'share-1', body: 'first' }),
              fakeShare({ id: 'share-2', body: 'second' }),
            ],
          },
        ],
      ],
      calls: [
        [
          sendMessage,
          (_signal: AbortSignal, _link: unknown, message: { body: string }) => {
            sent.push(message.body);
            return true;
          },
        ],
      ],
    });

    expect(sent).toEqual(['first', 'second']);
    expect(trace.commits).toEqual([
      [shareSentTopic('share-1')],
      [shareSentTopic('share-2')],
    ]);
  });

  it('leaves what it has already sent alone', async () => {
    const send = vi.fn(() => true);

    const trace = await simulate(flush(), {
      reads: [
        [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
        [
          shareLogStore,
          {
            items: [
              fakeShare({ id: 'share-1', status: 'sent' }),
              fakeShare({ id: 'share-2', status: 'received' }),
              fakeShare({ id: 'share-3', endpointId: 'ep-3' }),
            ],
          },
        ],
      ],
      calls: [[sendMessage, send]],
    });

    // Only this peer's, and only the ones still waiting. A flush runs on
    // every link, so a re-send would double up the whole session.
    expect(send).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });

  it('stops at the first send that doesn’t land', async () => {
    const send = vi.fn(() => false);

    const trace = await simulate(flush(), {
      reads: [
        [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
        [
          shareLogStore,
          {
            items: [fakeShare({ id: 'share-1' }), fakeShare({ id: 'share-2' })],
          },
        ],
      ],
      calls: [[sendMessage, send]],
    });

    // The link is gone. Marching on would report a pile of shares as sent
    // that nobody received.
    expect(send).toHaveBeenCalledTimes(1);
    expect(trace.commits).toEqual([]);
  });
});

describe('receiveShareSaga', () => {
  it('takes a share from a paired device', async () => {
    const trace = await simulate(
      receiveShareSaga({ endpointId: PEER_ID, body: 'kettle is on' }),
      {
        reads: [
          [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
        ],
        calls: [
          [now, () => 1234],
          [newShareId, () => 'share-1'],
        ],
      },
    );

    expect(trace.commits).toEqual([
      [
        shareReceivedTopic({
          id: 'share-1',
          endpointId: PEER_ID,
          body: 'kettle is on',
          at: 1234,
        }),
      ],
    ]);
  });

  it('drops a share from a peer nobody accepted', async () => {
    const trace = await simulate(
      receiveShareSaga({ endpointId: PEER_ID, body: 'buy something' }),
      {
        reads: [
          [contactsStore, bookHolding(fakeContact({ trust: 'invited' }))],
        ],
        calls: [
          [now, () => 1234],
          [newShareId, () => 'share-1'],
        ],
      },
    );

    // A stranger can dial in and start talking before anyone has agreed to
    // anything. This is the guard that keeps it off the screen.
    expect(trace.commits).toEqual([]);
  });

  it('drops a share from a peer that isn’t in the book at all', async () => {
    const trace = await simulate(
      receiveShareSaga({ endpointId: 'ep-9', body: 'buy something' }),
      {
        reads: [[contactsStore, bookHolding()]],
        calls: [
          [now, () => 1234],
          [newShareId, () => 'share-1'],
        ],
      },
    );

    expect(trace.commits).toEqual([]);
  });
});
