/**
 * Unit tests for the handshake: what a peer can change about a pairing by
 * saying so, and what this device says back. Mostly simulated; the last suite
 * runs against a real runtime, because a saga whose behaviour turns on trust
 * changing *underneath it* can't be — a stubbed read hands back the same
 * value every time.
 */

import { createTestRuntime, simulate } from '@lib/state';
import { sendMessage } from '../../platform/iroh';
import {
  acceptMessage,
  helloMessage,
  shareMessage,
} from '../../platform/protocol';
import { newShareId, now } from '../../platform/host';
import { saveContact } from '../../platform/database';
import { peerHandlesCell, peerLinkedTopic } from '../peers';
import { deviceNameFormula, identityStore } from '../../identity';
import { contactsRestoredTopic, contactsStore } from '../../contacts';
import {
  contactAdvertisedTopic,
  pairingAcceptedTopic,
  pairingConfirmedTopic,
} from '../../contacts/contacts';
import {
  shareLogStore,
  shareQueuedTopic,
  shareReceivedTopic,
} from '../../shares';
import {
  acceptPairingSaga,
  applyPeerMessageSaga,
  renameDeviceSaga,
} from '../sagas/pairing';
import { beamScope } from '../../scope';
import type { PeerConnection } from '@crate/p2p';
import type { PeerLink } from '../../platform/iroh';
import { createInbox } from '../../platform/inbox';
import type { Contact } from '../../platform/database';

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

describe('renameDeviceSaga', () => {
  /** This device's row, as the rename reads it back to write it through. */
  const named = (label: string | null) => ({
    ...bookHolding(),
    self: {
      kind: 'self' as const,
      endpointId: SELF_ID,
      label,
      createdAt: 1,
    },
  });

  it('tells the devices already on the line', async () => {
    const send = vi.fn();
    const first = fakeLink();
    const second = fakeLink(`e3${'0'.repeat(62)}`);

    const trace = await simulate(renameDeviceSaga('Studio'), {
      reads: [
        [identityStore, { endpointId: SELF_ID }],
        [contactsStore, named('Studio')],
        [deviceNameFormula, 'Studio'],
        [
          peerHandlesCell,
          new Map([
            [first.endpointId, first],
            [second.endpointId, second],
          ]),
        ],
      ],
      calls: [
        [now, () => 1],
        [saveContact, vi.fn()],
        [sendMessage, send],
      ],
    });

    // The greeting is the only time a peer hears this name, so a rename that
    // stopped at disk would leave every connected device calling this one by
    // a name it stopped answering to.
    expect(trace.result).toBe(true);
    expect(send).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      first,
      helloMessage('Studio'),
    );
    expect(send).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      second,
      helloMessage('Studio'),
    );
  });

  it('announces what a cleared name falls back to', async () => {
    const send = vi.fn();
    const link = fakeLink();

    await simulate(renameDeviceSaga(null), {
      reads: [
        [identityStore, { endpointId: SELF_ID }],
        [contactsStore, named(null)],
        // Read back rather than reused: clearing leaves the key prefix, and
        // that's a name rather than an absence, so it's what goes out.
        [deviceNameFormula, 'e1000000'],
        [peerHandlesCell, new Map([[link.endpointId, link]])],
      ],
      calls: [
        [now, () => 1],
        [saveContact, vi.fn()],
        [sendMessage, send],
      ],
    });

    expect(send).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      link,
      helloMessage('e1000000'),
    );
  });

  it('says nothing when the rename didn’t take', async () => {
    const send = vi.fn();
    const link = fakeLink();

    const trace = await simulate(renameDeviceSaga('Studio'), {
      reads: [
        [identityStore, { endpointId: null }],
        [peerHandlesCell, new Map([[link.endpointId, link]])],
      ],
      calls: [[sendMessage, send]],
    });

    // No key means no row was written, and announcing a name nothing on disk
    // agrees with would leave the peers ahead of this device.
    expect(trace.result).toBe(false);
    expect(send).not.toHaveBeenCalled();
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
