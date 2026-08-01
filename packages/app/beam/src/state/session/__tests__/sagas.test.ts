/**
 * Unit tests for the beam session's sagas. Most run under `simulate`, so
 * there's no runtime and no state — every capability is stubbed and the
 * assertions are about what the saga published, which is exactly where the
 * one-transition guarantee lives.
 *
 * The exception is at the bottom: a saga whose behaviour turns on state
 * changing *underneath it* can't be simulated, because a stubbed read hands
 * back the same value every time. Those run against a real runtime.
 */

import { createTestRuntime, simulate } from '@lib/state';
import type { Endpoint, PeerConnection } from '@crate/p2p';
import {
  awaitPeerClose,
  copyText,
  dialEndpoint,
  encodeBeamCode,
  loadIdentity,
  newShareId,
  openConnection,
  receiveNext,
  releasePeer,
  sendMessage,
  wait,
  type PeerLink,
  type EndpointSession,
  type SelfKey,
} from '../capabilities';
import {
  connectFailedTopic,
  connectedTopic,
  connectingTopic,
  connectionStore,
  endpointCell,
} from '../connection';
import {
  identityAbsentTopic,
  identityFailedTopic,
  identityResolvedTopic,
  selfLabelFormula,
} from '../identity';
import { createInbox } from '../inbox';
import {
  peerDialingTopic,
  peerHandlesCell,
  peerLinkedTopic,
  peerLinksStore,
  peerReleasedTopic,
  peerUnreachableTopic,
} from '../peers';
import { acceptMessage, helloMessage, shareMessage } from '../protocol';
import { codeEncodedTopic, type QrGrid } from '../qr-code';
import {
  COPY_NOTICE_DURATION,
  copyNoticeExpiredTopic,
  draftClearedTopic,
  shareCopiedTopic,
  shareLogStore,
  shareQueuedTopic,
  shareReceivedTopic,
  shareSentTopic,
  type Share,
} from '../shares';
import {
  acceptPairingSaga,
  applyPeerMessageSaga,
  connectRelaySaga,
  copyShareSaga,
  dialPeerSaga,
  disconnectPeerSaga,
  encodeInviteSaga,
  flushSharesSaga,
  greetPeerSaga,
  linkPeerSaga,
  receiveShareSaga,
  serveInboundSaga,
  shareTextSaga,
  watchRelaySaga,
} from '../sagas';
import { now, saveContact } from '../../contacts/capabilities';
import {
  contactAdvertisedTopic,
  contactSeenTopic,
  contactsRestoredTopic,
  contactsStore,
  pairingAcceptedTopic,
  pairingConfirmedTopic,
} from '../../contacts/contacts';
import type { Contact } from '../../contacts/database';
import { beamScope } from '../../scope';

/**
 * Stand-in endpoint ids for this device and the peer it talks to. Well-formed
 * — 32 bytes of lowercase hex — rather than a readable placeholder, because
 * {@link dialPeerSaga} checks the format before it records anything. A
 * `peer-1` here would be turned away as a malformed link, and every test in
 * this file that expects a dial to do nothing would pass for the wrong reason.
 */
const SELF_ID = `e1${'0'.repeat(62)}`;
const PEER_ID = `e2${'0'.repeat(62)}`;

/**
 * A stand-in endpoint session. The sagas only read the endpoint's id and drain the
 * peer queue; everything else about one goes through a capability.
 */
const fakeSession: EndpointSession = {
  endpoint: { id: SELF_ID } as Endpoint,
  peers: createInbox<PeerLink>(),
  relay: createInbox<string | null>(),
  release: () => undefined,
};

/** A stand-in identity. Only the address is ever looked at. */
const fakeSelf: SelfKey = {
  endpointId: SELF_ID,
  secretKey: new Uint8Array(32),
};

const fakeGrid: QrGrid = { size: 1, modules: new Uint8Array([1]) };

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

describe('connectRelaySaga', () => {
  /** A connect nothing has started yet. */
  const idle = () =>
    [
      [
        connectionStore,
        { status: 'connecting', homeRelay: null, started: false },
      ],
    ] as const;

  it('names this device before it joins anything', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [...idle()],
      calls: [
        [loadIdentity, () => fakeSelf],
        [openConnection, () => fakeSession],
      ],
    });

    // Two transitions, and the order is the point: the address is derived
    // from the key, so the header can name this device while the handshake
    // is still a round trip away.
    expect(trace.commits).toEqual([
      [connectingTopic()],
      [identityResolvedTopic(SELF_ID)],
      [connectedTopic(fakeSession)],
    ]);
  });

  it('joins the network under the identity it just settled', async () => {
    const open = vi.fn(() => fakeSession);

    await simulate(connectRelaySaga(), {
      reads: [...idle()],
      calls: [
        [loadIdentity, () => fakeSelf],
        [openConnection, open],
      ],
    });

    expect(open).toHaveBeenCalledWith(expect.any(AbortSignal), fakeSelf);
  });

  it('serves dials, watches the relay, and draws the code', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [...idle()],
      calls: [
        [loadIdentity, () => fakeSelf],
        [openConnection, () => fakeSession],
      ],
    });

    // Nobody can pair with a device that isn't listening, nothing would
    // notice a relay coming and going, and the invite would have no code.
    expect(trace.spawns).toHaveLength(3);
  });

  it('records a failed handshake without stranding the view', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [...idle()],
      calls: [
        [loadIdentity, () => fakeSelf],
        [
          openConnection,
          () => {
            throw new Error('relay unreachable');
          },
        ],
      ],
    });

    // The identity still landed: a device that can't reach a relay still
    // knows what it's called and what its link is.
    expect(trace.commits).toEqual([
      [connectingTopic()],
      [identityResolvedTopic(SELF_ID)],
      [connectFailedTopic()],
    ]);
  });

  it('records a failure that beat the identity', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [...idle()],
      calls: [
        [
          loadIdentity,
          () => {
            throw new Error('wasm blocked');
          },
        ],
        [openConnection, vi.fn()],
      ],
    });

    // Both, in one transition: with no address there's nothing to dial from,
    // and an identity nobody could read is not the same news as a relay that
    // wouldn't answer.
    expect(trace.commits).toEqual([
      [connectingTopic()],
      [identityFailedTopic(), connectFailedTopic()],
    ]);
  });

  it('stops at an unset device rather than minting it a key', async () => {
    const open = vi.fn(() => fakeSession);

    const trace = await simulate(connectRelaySaga(), {
      reads: [...idle()],
      calls: [
        [loadIdentity, () => null],
        [openConnection, open],
      ],
    });

    // The absence is the fact, and it's the last one: there's nothing to
    // join the relay network as, and nothing to draw a beam link from.
    expect(trace.commits).toEqual([
      [connectingTopic()],
      [identityAbsentTopic()],
    ]);

    expect(open).not.toHaveBeenCalled();
    expect(trace.spawns).toHaveLength(0);
  });

  it('refuses to open a second endpoint over a live one', async () => {
    const open = vi.fn(() => fakeSession);

    const trace = await simulate(connectRelaySaga(), {
      reads: [
        [
          connectionStore,
          {
            status: 'connected',
            homeRelay: 'https://relay.example',
            started: true,
          },
        ],
      ],
      calls: [
        [loadIdentity, vi.fn()],
        [openConnection, open],
      ],
    });

    // Guarded on `started` rather than the status, which begins already
    // showing a connect under way. The cell holds one endpoint; a second
    // connect would drop the first unfreed.
    expect(open).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });
});

describe('encodeInviteSaga', () => {
  it('encodes the link for this device’s address', async () => {
    const encode = vi.fn(() => fakeGrid);

    const trace = await simulate(encodeInviteSaga(SELF_ID), {
      calls: [[encodeBeamCode, encode]],
    });

    expect(encode).toHaveBeenCalledWith(expect.any(AbortSignal), SELF_ID);
    expect(trace.commits).toEqual([[codeEncodedTopic(fakeGrid)]]);
  });

  it('says so when the encode found no code', async () => {
    const trace = await simulate(encodeInviteSaga(SELF_ID), {
      calls: [[encodeBeamCode, () => null]],
    });

    // A missing code is non-fatal: the link is still copyable.
    expect(trace.commits).toEqual([[codeEncodedTopic(null)]]);
  });
});

describe('watchRelaySaga', () => {
  /**
   * A runtime whose relay queue hands back `changes` in order and then dies,
   * the way a released scope ends the loop. Real rather than simulated: the
   * point is what the header ends up showing, which is state.
   */
  const watching = async (changes: ReadonlyArray<string | null>) => {
    const queued = [...changes];

    const runtime = createTestRuntime({
      calls: [
        [
          receiveNext,
          () => {
            if (queued.length === 0) throw new Error('scope released');
            return queued.shift();
          },
        ],
      ],
    });

    runtime.anchor(beamScope);
    await expect(runtime.run(watchRelaySaga(fakeSession))).rejects.toThrow(
      'scope released',
    );

    return runtime;
  };

  it('mirrors a relay coming up', async () => {
    const { peek } = await watching(['https://relay.example']);

    expect(peek(connectionStore).status).toBe('connected');
    expect(peek(connectionStore).homeRelay).toBe('https://relay.example');
  });

  it('mirrors a relay going away', async () => {
    const { peek } = await watching(['https://relay.example', null]);

    // Back to the spinner, not an error: iroh finds another on its own.
    expect(peek(connectionStore).status).toBe('connecting');
    expect(peek(connectionStore).homeRelay).toBeNull();
  });
});

describe('serveInboundSaga', () => {
  it('drains the queue the session was handed', async () => {
    const receive = vi.fn(() => {
      throw new Error('scope released');
    });

    await expect(
      simulate(serveInboundSaga(fakeSession), {
        calls: [[receiveNext, receive]],
      }),
    ).rejects.toThrow('scope released');

    // The queue is filled by the endpoint's own listener, wired before the
    // connect — so the saga has only to pull from it.
    expect(receive).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      fakeSession.peers,
    );
  });
});

describe('linkPeerSaga', () => {
  /** Stubs for the plumbing every link runs through. */
  const wiring = () =>
    [
      [sendMessage, vi.fn()],
      [releasePeer, vi.fn()],
    ] as const;

  it('holds the link and introduces this device', async () => {
    const send = vi.fn();
    const link = fakeLink();

    const trace = await simulate(linkPeerSaga(link), {
      reads: [
        [peerHandlesCell, new Map()],
        [selfLabelFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact())],
      ],
      calls: [...wiring(), [sendMessage, send]],
    });

    expect(trace.commits).toEqual([[peerLinkedTopic(link)]]);
    expect(send).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      link,
      helloMessage('abcd1234'),
    );
  });

  it('starts draining the peer\u2019s messages and watching for its exit', async () => {
    const trace = await simulate(linkPeerSaga(fakeLink()), {
      reads: [
        [peerHandlesCell, new Map()],
        [selfLabelFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact())],
      ],
      calls: [...wiring()],
    });

    // The link arrives already listening \u2014 the capability wires its queue
    // as it wraps the connection \u2014 so what's left to check here is that
    // something is pulling from that queue, and that something notices when
    // the far side hangs up.
    expect(trace.spawns).toHaveLength(2);
  });

  it('says nothing about itself before the endpoint names it', async () => {
    const send = vi.fn();

    await simulate(linkPeerSaga(fakeLink()), {
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

    await simulate(linkPeerSaga(link), {
      reads: [
        [peerHandlesCell, new Map()],
        [selfLabelFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
        [shareLogStore, { items: [] }],
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

    await simulate(linkPeerSaga(fakeLink()), {
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

  it('sends what was queued while the peer was away', async () => {
    const send = vi.fn(() => true);
    const link = fakeLink();

    const trace = await simulate(linkPeerSaga(link), {
      reads: [
        [peerHandlesCell, new Map()],
        [selfLabelFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
        [shareLogStore, { items: [fakeShare({ body: 'kettle is on' })] }],
      ],
      calls: [...wiring(), [sendMessage, send]],
    });

    // The other half of queueing: a share written to a sleeping device is
    // held until the device turns up, and turning up is this.
    expect(send).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      link,
      shareMessage('kettle is on'),
    );
    expect(trace.commits.at(-1)).toEqual([shareSentTopic('share-1')]);
  });

  it('closes the link it replaces', async () => {
    const release = vi.fn();
    const stale = fakeLink();

    await simulate(linkPeerSaga(fakeLink()), {
      reads: [
        [peerHandlesCell, new Map([[PEER_ID, stale]])],
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

    const trace = await simulate(greetPeerSaga(link), {
      reads: [
        [contactsStore, bookHolding(fakeContact({ direction: 'inbound' }))],
        [peerHandlesCell, new Map()],
        [selfLabelFormula, 'abcd1234'],
      ],
      calls: [
        [now, () => 1234],
        [saveContact, vi.fn()],
        [sendMessage, vi.fn()],
        [releasePeer, vi.fn()],
      ],
    });

    // The request has to exist before the reader can be asked about it, and
    // it has to survive a reload the connection won't.
    expect(trace.commits).toEqual([
      [
        contactSeenTopic({
          endpointId: PEER_ID,
          direction: 'inbound',
          seenAt: 1234,
        }),
      ],
      [peerLinkedTopic(link)],
    ]);
  });
});

describe('applyPeerMessageSaga', () => {
  it('records the name a peer advertised', async () => {
    const trace = await simulate(
      applyPeerMessageSaga({
        endpointId: PEER_ID,
        message: helloMessage('Studio Mac'),
      }),
      {
        reads: [[contactsStore, bookHolding(fakeContact())]],
        calls: [[saveContact, vi.fn()]],
      },
    );

    expect(trace.commits).toEqual([
      [contactAdvertisedTopic({ endpointId: PEER_ID, label: 'Studio Mac' })],
    ]);
  });

  it('passes a claimed acceptance to the fold that judges it', async () => {
    const trace = await simulate(
      applyPeerMessageSaga({ endpointId: PEER_ID, message: acceptMessage() }),
      {
        reads: [[contactsStore, bookHolding(fakeContact())]],
        calls: [[saveContact, vi.fn()]],
      },
    );

    expect(trace.commits).toEqual([[pairingConfirmedTopic(PEER_ID)]]);
  });

  it('takes a share through the saga that judges the sender', async () => {
    const trace = await simulate(
      applyPeerMessageSaga({
        endpointId: PEER_ID,
        message: shareMessage('kettle is on'),
      }),
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
});

describe('dialPeerSaga', () => {
  /** Stubs for the bookkeeping and plumbing a dial runs through. */
  const wiring = () =>
    [
      [now, () => 1234],
      [saveContact, vi.fn()],
      [sendMessage, vi.fn()],
      [releasePeer, vi.fn()],
    ] as const;

  /** Reads a dial makes on its way through to a link. */
  const surroundings = () =>
    [
      [endpointCell, fakeSession],
      [peerLinksStore, { statuses: {} }],
      [peerHandlesCell, new Map()],
      [selfLabelFormula, 'abcd1234'],
      [contactsStore, bookHolding(fakeContact())],
    ] as const;

  it('dials over the endpoint the layout holds open', async () => {
    const dial = vi.fn(() => fakeLink());

    await simulate(dialPeerSaga(PEER_ID), {
      reads: [...surroundings()],
      calls: [...wiring(), [dialEndpoint, dial]],
    });

    expect(dial).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      fakeSession.endpoint,
      PEER_ID,
    );
  });

  it('records the peer before dialling it', async () => {
    const link = fakeLink();

    const trace = await simulate(dialPeerSaga(PEER_ID), {
      reads: [...surroundings()],
      calls: [...wiring(), [dialEndpoint, () => link]],
    });

    // The pairing outlives the dial, so it lands in the book whether or not
    // the connection ever comes up.
    expect(trace.commits).toEqual([
      [
        contactSeenTopic({
          endpointId: PEER_ID,
          direction: 'outbound',
          seenAt: 1234,
        }),
      ],
      [peerDialingTopic(PEER_ID)],
      [peerLinkedTopic(link)],
    ]);
  });

  it('reports a peer it couldn’t reach', async () => {
    const trace = await simulate(dialPeerSaga(PEER_ID), {
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
    expect(trace.commits.at(-1)).toEqual([peerUnreachableTopic(PEER_ID)]);
  });

  it('records nothing for an id that was never an address', async () => {
    const dial = vi.fn();

    const trace = await simulate(dialPeerSaga('bacon'), {
      reads: [...surroundings()],
      calls: [...wiring(), [dialEndpoint, dial]],
    });

    // `/beam/share/bacon` is a URL anybody can type. The book is written
    // before the dial, so without the guard a typo leaves a contact behind
    // for a device that could never have existed.
    expect(dial).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });

  it('still records a well-formed peer that never answers', async () => {
    const trace = await simulate(dialPeerSaga(PEER_ID), {
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

    // The other half of the rule above: a device that's merely asleep is
    // exactly the one worth keeping, since the link that named it may not
    // come round again. Only the malformed id is turned away.
    expect(trace.commits[0]).toEqual([
      contactSeenTopic({
        endpointId: PEER_ID,
        direction: 'outbound',
        seenAt: 1234,
      }),
    ]);
  });

  it('does nothing when handed this device’s own beam link', async () => {
    const dial = vi.fn();

    const trace = await simulate(dialPeerSaga(SELF_ID), {
      reads: [[endpointCell, fakeSession]],
      calls: [...wiring(), [dialEndpoint, dial]],
    });

    // Scanning your own code shouldn't dial yourself or leave a contact for
    // this very device in the book.
    expect(dial).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });

  it('leaves a peer it is already linked to alone', async () => {
    const dial = vi.fn();

    const trace = await simulate(dialPeerSaga(PEER_ID), {
      reads: [
        [endpointCell, fakeSession],
        [peerLinksStore, { statuses: { [PEER_ID]: 'linked' } }],
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

    await simulate(dialPeerSaga(PEER_ID), {
      reads: [
        [endpointCell, fakeSession],
        [peerLinksStore, { statuses: { [PEER_ID]: 'dialing' } }],
      ],
      calls: [...wiring(), [dialEndpoint, dial]],
    });

    expect(dial).not.toHaveBeenCalled();
  });

  it('dials a peer whose last attempt failed', async () => {
    const dial = vi.fn(() => fakeLink());

    await simulate(dialPeerSaga(PEER_ID), {
      reads: [
        [endpointCell, fakeSession],
        [peerLinksStore, { statuses: { [PEER_ID]: 'unreachable' } }],
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
      simulate(dialPeerSaga(PEER_ID), {
        reads: [[endpointCell, null]],
        calls: [[dialEndpoint, vi.fn()]],
      }),
    ).rejects.toThrow('Cannot dial a peer before the relay connection is up.');
  });
});

describe('acceptPairingSaga', () => {
  it('promotes the pairing and tells the peer', async () => {
    const send = vi.fn();
    const link = fakeLink();

    const trace = await simulate(acceptPairingSaga(PEER_ID), {
      reads: [
        [contactsStore, bookHolding(fakeContact({ trust: 'trusted' }))],
        [peerHandlesCell, new Map([[PEER_ID, link]])],
        [shareLogStore, { items: [] }],
      ],
      calls: [
        [saveContact, vi.fn()],
        [sendMessage, send],
      ],
    });

    expect(trace.commits).toEqual([[pairingAcceptedTopic(PEER_ID)]]);
    expect(send).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      link,
      acceptMessage(),
    );
  });

  it('accepts a peer that isn’t here to be told', async () => {
    const send = vi.fn();

    const trace = await simulate(acceptPairingSaga(PEER_ID), {
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
    expect(trace.commits).toEqual([[pairingAcceptedTopic(PEER_ID)]]);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('disconnectPeerSaga', () => {
  it('hangs up without touching the pairing', async () => {
    const release = vi.fn();
    const link = fakeLink();

    const trace = await simulate(disconnectPeerSaga(PEER_ID), {
      reads: [[peerHandlesCell, new Map([[PEER_ID, link]])]],
      calls: [[releasePeer, release]],
    });

    // Leaving a share view ends the connection, not the relationship: the
    // contact stays, anything queued stays queued, and coming back re-dials.
    expect(release).toHaveBeenCalledWith(expect.any(AbortSignal), link);
    expect(trace.commits).toEqual([[peerReleasedTopic(PEER_ID)]]);
  });

  it('says nothing about a peer with no live link', async () => {
    const release = vi.fn();

    const trace = await simulate(disconnectPeerSaga(PEER_ID), {
      reads: [[peerHandlesCell, new Map()]],
      calls: [[releasePeer, release]],
    });

    expect(release).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });
});

describe('a peer hanging up', () => {
  it('marks the link closed once the connection ends', async () => {
    const link = fakeLink();
    let hangUp = () => undefined as void;
    const ended = new Promise<void>((resolve) => {
      hangUp = resolve;
    });

    const runtime = createTestRuntime({
      calls: [
        [saveContact, vi.fn()],
        [sendMessage, vi.fn()],
        [releasePeer, vi.fn()],
        [awaitPeerClose, () => ended],
      ],
    });

    runtime.anchor(beamScope);
    runtime.commit(contactsRestoredTopic([fakeContact({ trust: 'trusted' })]));

    await runtime.run(linkPeerSaga(link));
    expect(runtime.peek(peerLinksStore).statuses[PEER_ID]).toBe('linked');

    hangUp();

    // The other half of leaving a share view: the device left holding the
    // link finds out, rather than going on showing a peer that isn't there.
    await vi.waitFor(() => {
      expect(runtime.peek(peerLinksStore).statuses[PEER_ID]).toBe('closed');
    });

    expect(runtime.peek(peerHandlesCell).has(PEER_ID)).toBe(false);
  });
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

describe('copyShareSaga', () => {
  it('copies the body and says so for a moment', async () => {
    const copy = vi.fn(() => true);
    const sleep = vi.fn();

    const trace = await simulate(
      copyShareSaga({ id: 'share-1', body: 'kettle is on' }),
      {
        calls: [
          [copyText, copy],
          [wait, sleep],
        ],
      },
    );

    expect(copy).toHaveBeenCalledWith(expect.any(AbortSignal), 'kettle is on');
    expect(sleep).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      COPY_NOTICE_DURATION,
    );
    expect(trace.commits).toEqual([
      [shareCopiedTopic('share-1')],
      [copyNoticeExpiredTopic('share-1')],
    ]);
  });

  it('claims nothing when the clipboard refuses', async () => {
    const trace = await simulate(
      copyShareSaga({ id: 'share-1', body: 'kettle is on' }),
      {
        calls: [
          [copyText, () => false],
          [wait, vi.fn()],
        ],
      },
    );

    // A confirmation for a copy that didn't happen is worse than none.
    expect(trace.commits).toEqual([]);
  });
});

describe('a pairing landing mid-saga', () => {
  /** A runtime holding a peer we invited, linked, with a share waiting. */
  const setup = (send: () => boolean) => {
    const link = fakeLink();

    const runtime = createTestRuntime({
      calls: [
        [saveContact, vi.fn()],
        [sendMessage, vi.fn(send)],
      ],
    });

    runtime.anchor(beamScope);
    runtime.commit(
      contactsRestoredTopic([
        fakeContact({ trust: 'invited', direction: 'outbound' }),
      ]),
      peerLinkedTopic(link),
      shareQueuedTopic({
        id: 'share-1',
        endpointId: PEER_ID,
        body: 'kettle is on',
        at: 1,
      }),
    );

    return { ...runtime, link };
  };

  it('sends the queue the moment the peer accepts', async () => {
    const send = vi.fn(() => true);
    const { run, peek, link } = setup(send);

    await run(
      applyPeerMessageSaga({ endpointId: PEER_ID, message: acceptMessage() }),
    );

    // The whole point of a queue: it fills before the peer has answered, so
    // the answer is what lets it out. A read hands back a live view of the
    // store, so noticing the trust moved means comparing the value across
    // the commit rather than the record holding it — get that wrong and the
    // share sits queued forever against a peer that already said yes.
    expect(peek(contactsStore).entries[PEER_ID]?.trust).toBe('trusted');
    expect(send).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      link,
      shareMessage('kettle is on'),
    );
    expect(peek(shareLogStore).items[0]?.status).toBe('sent');
  });

  it('leaves the queue alone when a stranger claims acceptance', async () => {
    const send = vi.fn(() => true);
    const runtime = createTestRuntime({
      calls: [
        [saveContact, vi.fn()],
        [sendMessage, send],
      ],
    });

    runtime.anchor(beamScope);
    runtime.commit(
      // Filed as `invited` inbound — a peer that dialled us. Its own claim
      // of acceptance grants it nothing.
      contactsRestoredTopic([
        fakeContact({ trust: 'invited', direction: 'inbound' }),
      ]),
      peerLinkedTopic(fakeLink()),
      shareQueuedTopic({
        id: 'share-1',
        endpointId: PEER_ID,
        body: 'kettle is on',
        at: 1,
      }),
    );

    await runtime.run(
      applyPeerMessageSaga({ endpointId: PEER_ID, message: acceptMessage() }),
    );

    expect(runtime.peek(contactsStore).entries[PEER_ID]?.trust).toBe('invited');
    expect(send).not.toHaveBeenCalled();
    expect(runtime.peek(shareLogStore).items[0]?.status).toBe('queued');
  });
});
