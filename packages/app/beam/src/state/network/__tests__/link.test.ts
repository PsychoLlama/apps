/**
 * Unit tests for the life of a peer link: opening one in either direction,
 * holding it, and letting it go. Mostly simulated; the last suite runs
 * against a real runtime, because a fold that turns on which handle is
 * currently held can't be stubbed.
 */

import { createTestRuntime, simulate } from '@lib/state';
import {
  awaitPeerClose,
  dialEndpoint,
  releasePeer,
  sendMessage,
} from '../../platform/iroh';
import { helloMessage, shareMessage } from '../../../protocol';
import { now } from '../../platform/host';
import { saveContact, saveOnboarding } from '../../platform/database';
import { endpointCell } from '../connection';
import {
  peerDialingTopic,
  peerHandlesCell,
  peerLinkedTopic,
  peerLinksStore,
  peerReleasedTopic,
  peerUnreachableTopic,
} from '../peers';
import { deviceNameFormula } from '../../identity';
import {
  contactSeenTopic,
  contactsRestoredTopic,
  contactsStore,
} from '../../contacts';
import {
  onboardingAdvancedTopic,
  onboardingStore,
} from '../../onboarding/progress';
import { shareLogStore, shareSentTopic } from '../../shares';
import {
  dialPeerSaga,
  disconnectPeerSaga,
  greetPeerSaga,
  linkPeerSaga,
} from '../sagas/link';
import { beamScope } from '../../scope';
import type { Endpoint, PeerConnection } from '@crate/p2p';
import type { EndpointSession, PeerLink } from '../../platform/iroh';
import { createInbox } from '../../platform/inbox';
import type { Contact } from '../../platform/database';
import type { Share } from '../../shares';

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

/**
 * A device that finished setting up. The default for the peer sagas, which
 * all run through the last setup step and have nothing to say about it once
 * it's answered — the two tests that *are* about it read `midSetup` instead.
 */
const setUp = () => ({ status: 'ready', step: 'done', updatedAt: 1 }) as const;

/** A device on setup's last step, waiting to meet somebody. */
const midSetup = () =>
  ({ status: 'ready', step: 'pairing', updatedAt: 1 }) as const;

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
        [deviceNameFormula, 'abcd1234'],
        [shareLogStore, { items: [] }],
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
        [deviceNameFormula, 'abcd1234'],
        [shareLogStore, { items: [] }],
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
        [deviceNameFormula, null],
        [shareLogStore, { items: [] }],
      ],
      calls: [...wiring(), [sendMessage, send]],
    });

    expect(send).not.toHaveBeenCalled();
  });

  it('sends what was queued while the peer was away', async () => {
    const send = vi.fn(() => true);
    const link = fakeLink();

    const trace = await simulate(linkPeerSaga(link), {
      reads: [
        [peerHandlesCell, new Map()],
        [deviceNameFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact())],
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
        [deviceNameFormula, 'abcd1234'],
        [shareLogStore, { items: [] }],
      ],
      calls: [...wiring(), [releasePeer, release]],
    });

    // Nothing reads the old connection any more; leaving it would strand it
    // open for the life of the scope.
    expect(release).toHaveBeenCalledWith(expect.any(AbortSignal), stale);
  });
});

describe('greetPeerSaga', () => {
  it('files an inbound dial in the book before linking it', async () => {
    const link = fakeLink();

    const trace = await simulate(greetPeerSaga(link), {
      reads: [
        [contactsStore, bookHolding(fakeContact())],
        [peerHandlesCell, new Map()],
        [deviceNameFormula, 'abcd1234'],
        [onboardingStore, setUp()],
        [shareLogStore, { items: [] }],
      ],
      calls: [
        [now, () => 1234],
        [saveContact, vi.fn()],
        [sendMessage, vi.fn()],
        [releasePeer, vi.fn()],
        [saveOnboarding, vi.fn()],
      ],
    });

    // The contact has to survive a reload the connection won't, so it lands
    // before anything is done with the link.
    expect(trace.commits).toEqual([
      [contactSeenTopic({ endpointId: PEER_ID, seenAt: 1234 })],
      [peerLinkedTopic(link)],
    ]);
  });

  it('ends setup for a device that has just been found', async () => {
    const trace = await simulate(greetPeerSaga(fakeLink()), {
      reads: [
        [contactsStore, bookHolding(fakeContact())],
        [peerHandlesCell, new Map()],
        [deviceNameFormula, 'abcd1234'],
        [onboardingStore, midSetup()],
        [shareLogStore, { items: [] }],
      ],
      calls: [
        [now, () => 1234],
        [saveContact, vi.fn()],
        [sendMessage, vi.fn()],
        [releasePeer, vi.fn()],
        [saveOnboarding, vi.fn()],
      ],
    });

    // Being found answers the last step as well as finding somebody does.
    // Whoever scanned the code is on the other end of this.
    expect(trace.commits).toContainEqual([
      onboardingAdvancedTopic({ step: 'done', updatedAt: 1234 }),
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
      [saveOnboarding, vi.fn()],
    ] as const;

  /** Reads a dial makes on its way through to a link. */
  const surroundings = () =>
    [
      [endpointCell, fakeSession],
      [peerLinksStore, { statuses: {} }],
      [peerHandlesCell, new Map()],
      [deviceNameFormula, 'abcd1234'],
      [contactsStore, bookHolding(fakeContact())],
      [onboardingStore, setUp()],
      [shareLogStore, { items: [] }],
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

    // The contact outlives the dial, so it lands in the book whether or not
    // the connection ever comes up.
    expect(trace.commits).toEqual([
      [contactSeenTopic({ endpointId: PEER_ID, seenAt: 1234 })],
      [peerDialingTopic(PEER_ID)],
      [peerLinkedTopic(link)],
    ]);
  });

  it('ends setup for a device that has just found somebody', async () => {
    const trace = await simulate(dialPeerSaga(PEER_ID), {
      reads: [
        [endpointCell, fakeSession],
        [peerLinksStore, { statuses: {} }],
        [peerHandlesCell, new Map()],
        [deviceNameFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact())],
        [onboardingStore, midSetup()],
        [shareLogStore, { items: [] }],
      ],
      calls: [...wiring(), [dialEndpoint, () => fakeLink()]],
    });

    // Scanning a beam link is the ordinary way out of setup's last step, and
    // it lands with the contact rather than with the connection: a peer
    // that's merely asleep has still been met.
    expect(trace.commits).toContainEqual([
      onboardingAdvancedTopic({ step: 'done', updatedAt: 1234 }),
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

    // The contact stays in the book — it's the durable half — but the view
    // has to be able to say the device wasn't there.
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
      contactSeenTopic({ endpointId: PEER_ID, seenAt: 1234 }),
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
        [deviceNameFormula, 'abcd1234'],
        [contactsStore, bookHolding(fakeContact())],
        [onboardingStore, setUp()],
        [shareLogStore, { items: [] }],
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

describe('disconnectPeerSaga', () => {
  it('hangs up without touching the contact', async () => {
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
    runtime.commit(contactsRestoredTopic([fakeContact()]));

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
