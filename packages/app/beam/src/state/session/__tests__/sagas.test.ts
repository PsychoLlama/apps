/**
 * Unit tests for the beam session's sagas. These run under `simulate`, so
 * there's no runtime and no state — every capability is stubbed and the
 * assertions are about what the saga published, which is exactly where the
 * one-transition guarantee lives.
 */

import { simulate } from '@lib/state';
import type { PeerConnection, Relay } from '@crate/iroh';
import {
  acceptInboundPeers,
  dialEndpoint,
  encodeBeamCode,
  listenToPeer,
  openConnection,
  receiveNext,
  releasePeer,
  sendMessage,
} from '../capabilities';
import {
  connectFailedTopic,
  connectedTopic,
  connectingTopic,
  connectionStore,
  relayCell,
} from '../connection';
import { selfLabelFormula } from '../identity';
import { createInbox } from '../inbox';
import {
  peerDialingTopic,
  peerHandlesCell,
  peerLinkedTopic,
  peerLinksStore,
  peerReleasedTopic,
  peerUnreachableTopic,
} from '../peers';
import { acceptMessage, helloMessage } from '../protocol';
import { codeEncodedTopic, type QrGrid } from '../qr-code';
import {
  acceptPairingSaga,
  applyPeerMessageSaga,
  cancelPairingSaga,
  connectRelaySaga,
  dialPeerSaga,
  greetPeerSaga,
  linkPeerSaga,
  serveInboundSaga,
} from '../sagas';
import { now, saveContact, removeContact } from '../../contacts/capabilities';
import {
  contactAdvertisedTopic,
  contactForgottenTopic,
  contactSeenTopic,
  contactsStore,
  pairingAcceptedTopic,
  pairingConfirmedTopic,
} from '../../contacts/contacts';
import type { Contact } from '../../contacts/database';

/** A stand-in endpoint. The sagas only read its id and hand it onward. */
const fakeRelay = { endpointId: 'ep-1' } as Relay;

const fakeGrid: QrGrid = { size: 1, modules: new Uint8Array([1]) };

/** A stand-in peer link. Everything done to one goes through a capability. */
const fakeLink = (): PeerConnection => ({}) as PeerConnection;

const fakeContact = (overrides: Partial<Contact> = {}): Contact => ({
  endpointId: 'ep-2',
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

describe('connectRelaySaga', () => {
  it('lands the relay and its code in one transition', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [[connectionStore, { status: 'initial' }]],
      calls: [
        [openConnection, () => fakeRelay],
        [encodeBeamCode, () => fakeGrid],
      ],
    });

    expect(trace.commits).toEqual([
      [connectingTopic()],
      [connectedTopic(fakeRelay), codeEncodedTopic(fakeGrid)],
    ]);
  });

  it('starts serving inbound dials once the relay is up', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [[connectionStore, { status: 'initial' }]],
      calls: [
        [openConnection, () => fakeRelay],
        [encodeBeamCode, () => fakeGrid],
      ],
    });

    // Nobody can pair with a device that isn't listening, and the relay is
    // the earliest moment it can.
    expect(trace.spawns).toHaveLength(1);
  });

  it('encodes the link for the endpoint it just opened', async () => {
    const encode = vi.fn(() => fakeGrid);

    await simulate(connectRelaySaga(), {
      reads: [[connectionStore, { status: 'initial' }]],
      calls: [
        [openConnection, () => fakeRelay],
        [encodeBeamCode, encode],
      ],
    });

    expect(encode).toHaveBeenCalledWith(expect.any(AbortSignal), 'ep-1');
  });

  it('still lands the connection when the encode found no code', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [[connectionStore, { status: 'initial' }]],
      calls: [
        [openConnection, () => fakeRelay],
        [encodeBeamCode, () => null],
      ],
    });

    // A missing code is non-fatal: the link is still copyable.
    expect(trace.commits).toEqual([
      [connectingTopic()],
      [connectedTopic(fakeRelay), codeEncodedTopic(null)],
    ]);
  });

  it('records a failed handshake without stranding the view', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [[connectionStore, { status: 'initial' }]],
      calls: [
        [
          openConnection,
          () => {
            throw new Error('relay unreachable');
          },
        ],
      ],
    });

    expect(trace.commits).toEqual([
      [connectingTopic()],
      [connectFailedTopic()],
    ]);
  });

  it('refuses to open a second relay over a live one', async () => {
    const open = vi.fn(() => fakeRelay);

    const trace = await simulate(connectRelaySaga(), {
      reads: [[connectionStore, { status: 'connected' }]],
      calls: [[openConnection, open]],
    });

    // The cell holds one relay; a second connect would drop the first
    // unfreed.
    expect(open).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });
});

describe('serveInboundSaga', () => {
  it('accepts over the relay it was handed', async () => {
    const accept = vi.fn(() => createInbox<never>());

    await expect(
      simulate(serveInboundSaga(fakeRelay), {
        calls: [
          [acceptInboundPeers, accept],
          [
            receiveNext,
            () => {
              throw new Error('scope released');
            },
          ],
        ],
      }),
    ).rejects.toThrow('scope released');

    expect(accept).toHaveBeenCalledWith(expect.any(AbortSignal), fakeRelay);
  });
});

describe('linkPeerSaga', () => {
  /** Stubs for the plumbing every link runs through. */
  const wiring = () =>
    [
      [listenToPeer, () => createInbox()],
      [sendMessage, vi.fn()],
      [releasePeer, vi.fn()],
    ] as const;

  it('holds the link and introduces this device', async () => {
    const send = vi.fn();
    const link = fakeLink();

    const trace = await simulate(linkPeerSaga({ endpointId: 'ep-2', link }), {
      reads: [
        [peerHandlesCell, new Map()],
        [selfLabelFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact())],
      ],
      calls: [...wiring(), [sendMessage, send]],
    });

    expect(trace.commits).toEqual([
      [peerLinkedTopic({ endpointId: 'ep-2', link })],
    ]);
    expect(send).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      link,
      helloMessage('abcd1234'),
    );
  });

  it('starts listening before it says anything', async () => {
    const order: string[] = [];

    await simulate(linkPeerSaga({ endpointId: 'ep-2', link: fakeLink() }), {
      reads: [
        [peerHandlesCell, new Map()],
        [selfLabelFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact())],
      ],
      calls: [
        ...wiring(),
        [
          listenToPeer,
          () => {
            order.push('listen');
            return createInbox();
          },
        ],
        [sendMessage, () => void order.push('send')],
      ],
    });

    // A peer that answers immediately would otherwise be answering into a
    // void.
    expect(order).toEqual(['listen', 'send']);
  });

  it('says nothing about itself before the relay names it', async () => {
    const send = vi.fn();

    await simulate(linkPeerSaga({ endpointId: 'ep-2', link: fakeLink() }), {
      reads: [
        [peerHandlesCell, new Map()],
        [selfLabelFormula, null],
        [contactsStore, bookHolding(fakeContact())],
      ],
      calls: [...wiring(), [sendMessage, send]],
    });

    expect(send).not.toHaveBeenCalled();
  });

  it('re-sends the acceptance to a peer already trusted', async () => {
    const send = vi.fn();
    const link = fakeLink();

    await simulate(linkPeerSaga({ endpointId: 'ep-2', link }), {
      reads: [
        [peerHandlesCell, new Map()],
        [selfLabelFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
      ],
      calls: [...wiring(), [sendMessage, send]],
    });

    // This is what makes pairing eventually consistent: accepting a peer
    // that was away sent nothing at the time, so the next link carries it.
    expect(send).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      link,
      acceptMessage(),
    );
  });

  it('claims nothing to a peer that hasn’t been accepted', async () => {
    const send = vi.fn();

    await simulate(linkPeerSaga({ endpointId: 'ep-2', link: fakeLink() }), {
      reads: [
        [peerHandlesCell, new Map()],
        [selfLabelFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact({ trust: 'invited' }))],
      ],
      calls: [...wiring(), [sendMessage, send]],
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      acceptMessage(),
    );
  });

  it('closes the link it replaces', async () => {
    const release = vi.fn();
    const stale = fakeLink();

    await simulate(linkPeerSaga({ endpointId: 'ep-2', link: fakeLink() }), {
      reads: [
        [peerHandlesCell, new Map([['ep-2', stale]])],
        [selfLabelFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact())],
      ],
      calls: [...wiring(), [releasePeer, release]],
    });

    // Nothing reads the old connection any more; leaving it would strand it
    // open for the life of the scope.
    expect(release).toHaveBeenCalledWith(expect.any(AbortSignal), stale);
  });
});

describe('greetPeerSaga', () => {
  it('files an inbound dial as a request before linking it', async () => {
    const link = fakeLink();

    const trace = await simulate(greetPeerSaga({ endpointId: 'ep-2', link }), {
      reads: [
        [contactsStore, bookHolding(fakeContact({ direction: 'inbound' }))],
        [peerHandlesCell, new Map()],
        [selfLabelFormula, 'abcd1234'],
      ],
      calls: [
        [now, () => 1234],
        [saveContact, vi.fn()],
        [listenToPeer, () => createInbox()],
        [sendMessage, vi.fn()],
        [releasePeer, vi.fn()],
      ],
    });

    // The request has to exist before the reader can be asked about it, and
    // it has to survive a reload the connection won't.
    expect(trace.commits).toEqual([
      [
        contactSeenTopic({
          endpointId: 'ep-2',
          direction: 'inbound',
          seenAt: 1234,
        }),
      ],
      [peerLinkedTopic({ endpointId: 'ep-2', link })],
    ]);
  });
});

describe('applyPeerMessageSaga', () => {
  it('records the name a peer advertised', async () => {
    const trace = await simulate(
      applyPeerMessageSaga({
        endpointId: 'ep-2',
        message: helloMessage('Studio Mac'),
      }),
      {
        reads: [[contactsStore, bookHolding(fakeContact())]],
        calls: [[saveContact, vi.fn()]],
      },
    );

    expect(trace.commits).toEqual([
      [contactAdvertisedTopic({ endpointId: 'ep-2', label: 'Studio Mac' })],
    ]);
  });

  it('passes a claimed acceptance to the fold that judges it', async () => {
    const trace = await simulate(
      applyPeerMessageSaga({ endpointId: 'ep-2', message: acceptMessage() }),
      {
        reads: [[contactsStore, bookHolding(fakeContact())]],
        calls: [[saveContact, vi.fn()]],
      },
    );

    expect(trace.commits).toEqual([[pairingConfirmedTopic('ep-2')]]);
  });
});

describe('dialPeerSaga', () => {
  /** Stubs for the bookkeeping and plumbing a dial runs through. */
  const wiring = () =>
    [
      [now, () => 1234],
      [saveContact, vi.fn()],
      [listenToPeer, () => createInbox()],
      [sendMessage, vi.fn()],
      [releasePeer, vi.fn()],
    ] as const;

  /** Reads a dial makes on its way through to a link. */
  const surroundings = () =>
    [
      [relayCell, fakeRelay],
      [peerLinksStore, { statuses: {} }],
      [peerHandlesCell, new Map()],
      [selfLabelFormula, 'abcd1234'],
      [contactsStore, bookHolding(fakeContact())],
    ] as const;

  it('dials over the relay the layout holds open', async () => {
    const dial = vi.fn(() => fakeLink());

    await simulate(dialPeerSaga('ep-2'), {
      reads: [...surroundings()],
      calls: [...wiring(), [dialEndpoint, dial]],
    });

    expect(dial).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      fakeRelay,
      'ep-2',
    );
  });

  it('records the peer before dialling it', async () => {
    const link = fakeLink();

    const trace = await simulate(dialPeerSaga('ep-2'), {
      reads: [...surroundings()],
      calls: [...wiring(), [dialEndpoint, () => link]],
    });

    // The pairing outlives the dial, so it lands in the book whether or not
    // the connection ever comes up.
    expect(trace.commits).toEqual([
      [
        contactSeenTopic({
          endpointId: 'ep-2',
          direction: 'outbound',
          seenAt: 1234,
        }),
      ],
      [peerDialingTopic('ep-2')],
      [peerLinkedTopic({ endpointId: 'ep-2', link })],
    ]);
  });

  it('reports a peer it couldn’t reach', async () => {
    const trace = await simulate(dialPeerSaga('ep-2'), {
      reads: [...surroundings()],
      calls: [
        ...wiring(),
        [
          dialEndpoint,
          () => {
            throw new Error('peer offline');
          },
        ],
      ],
    });

    // The contact stays in the book — the invite is the durable half — but
    // the view has to be able to say the device wasn't there.
    expect(trace.commits.at(-1)).toEqual([peerUnreachableTopic('ep-2')]);
  });

  it('does nothing when handed this device’s own beam link', async () => {
    const dial = vi.fn();

    const trace = await simulate(dialPeerSaga('ep-1'), {
      reads: [[relayCell, fakeRelay]],
      calls: [...wiring(), [dialEndpoint, dial]],
    });

    // Scanning your own code shouldn't dial yourself or leave a contact for
    // this very device in the book.
    expect(dial).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });

  it('leaves a peer it is already linked to alone', async () => {
    const dial = vi.fn();

    const trace = await simulate(dialPeerSaga('ep-2'), {
      reads: [
        [relayCell, fakeRelay],
        [peerLinksStore, { statuses: { 'ep-2': 'linked' } }],
      ],
      calls: [...wiring(), [dialEndpoint, dial]],
    });

    // Returning to the share view re-runs the dial; a second one would
    // replace a working link with an identical one for nothing.
    expect(dial).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });

  it('leaves a dial already in flight alone', async () => {
    const dial = vi.fn();

    await simulate(dialPeerSaga('ep-2'), {
      reads: [
        [relayCell, fakeRelay],
        [peerLinksStore, { statuses: { 'ep-2': 'dialing' } }],
      ],
      calls: [...wiring(), [dialEndpoint, dial]],
    });

    expect(dial).not.toHaveBeenCalled();
  });

  it('dials a peer whose last attempt failed', async () => {
    const dial = vi.fn(() => fakeLink());

    await simulate(dialPeerSaga('ep-2'), {
      reads: [
        [relayCell, fakeRelay],
        [peerLinksStore, { statuses: { 'ep-2': 'unreachable' } }],
        [peerHandlesCell, new Map()],
        [selfLabelFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact())],
      ],
      calls: [...wiring(), [dialEndpoint, dial]],
    });

    // Reopening the link is the only retry affordance there is.
    expect(dial).toHaveBeenCalled();
  });

  it('rejects a dial attempted before the connection is up', async () => {
    await expect(
      simulate(dialPeerSaga('ep-2'), {
        reads: [[relayCell, null]],
        calls: [[dialEndpoint, vi.fn()]],
      }),
    ).rejects.toThrow('Cannot dial a peer before the relay connection is up.');
  });
});

describe('acceptPairingSaga', () => {
  it('promotes the pairing and tells the peer', async () => {
    const send = vi.fn();
    const link = fakeLink();

    const trace = await simulate(acceptPairingSaga('ep-2'), {
      reads: [
        [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
        [peerHandlesCell, new Map([['ep-2', link]])],
      ],
      calls: [
        [saveContact, vi.fn()],
        [sendMessage, send],
      ],
    });

    expect(trace.commits).toEqual([[pairingAcceptedTopic('ep-2')]]);
    expect(send).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      link,
      acceptMessage(),
    );
  });

  it('accepts a peer that isn’t here to be told', async () => {
    const send = vi.fn();

    const trace = await simulate(acceptPairingSaga('ep-2'), {
      reads: [
        [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
        [peerHandlesCell, new Map()],
      ],
      calls: [
        [saveContact, vi.fn()],
        [sendMessage, send],
      ],
    });

    // A request outlives the connection it arrived on, so answering it can't
    // depend on the other device still being awake. The next link carries
    // the news.
    expect(trace.commits).toEqual([[pairingAcceptedTopic('ep-2')]]);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('cancelPairingSaga', () => {
  it('drops the link and forgets the contact', async () => {
    const release = vi.fn();
    const link = fakeLink();

    const trace = await simulate(cancelPairingSaga('ep-2'), {
      reads: [
        [peerHandlesCell, new Map([['ep-2', link]])],
        [contactsStore, bookHolding(fakeContact())],
      ],
      calls: [
        [releasePeer, release],
        [removeContact, vi.fn()],
      ],
    });

    expect(release).toHaveBeenCalledWith(expect.any(AbortSignal), link);
    expect(trace.commits).toEqual([
      [peerReleasedTopic('ep-2')],
      [contactForgottenTopic('ep-2')],
    ]);
  });

  it('forgets a contact that was never linked', async () => {
    const trace = await simulate(cancelPairingSaga('ep-2'), {
      reads: [
        [peerHandlesCell, new Map()],
        [contactsStore, bookHolding(fakeContact())],
      ],
      calls: [
        [releasePeer, vi.fn()],
        [removeContact, vi.fn()],
      ],
    });

    expect(trace.commits).toEqual([[contactForgottenTopic('ep-2')]]);
  });
});
