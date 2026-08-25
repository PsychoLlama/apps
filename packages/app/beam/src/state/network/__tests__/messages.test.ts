/**
 * Unit tests for what a peer can change by saying so, and what this device
 * says back. Simulated, so the assertions are about what each saga published
 * and handed to the transport.
 */

import { simulate } from '@lib/state';
import { sendMessage } from '../../platform/iroh';
import { helloMessage, shareMessage } from '../../../protocol';
import { newShareId, now } from '../../platform/host';
import { saveContact } from '../../platform/database';
import { peerHandlesCell } from '../peers';
import { deviceNameFormula, identityStore } from '../../identity';
import { contactsStore } from '../../contacts';
import { contactAdvertisedTopic } from '../../contacts/contacts';
import { shareReceivedTopic } from '../../shares';
import { applyPeerMessageSaga, renameDeviceSaga } from '../sagas/messages';
import type { PeerLink } from '../../platform/iroh';
import { createInbox } from '../../platform/inbox';
import type { Contact } from '../../platform/database';

/**
 * Stand-in endpoint ids for this device and the peer it talks to. Well-formed
 * — 32 bytes of lowercase hex — because a cleared device name falls back to
 * the key prefix, and a readable placeholder would make that fallback read as
 * something no real device could produce.
 */
const SELF_ID = `e1${'0'.repeat(62)}`;

const PEER_ID = `e2${'0'.repeat(62)}`;

/**
 * A stand-in peer link, already listening — which is what a real one is by
 * the time a saga sees it. Everything done to one goes through a capability.
 */
const fakeLink = (endpointId = PEER_ID): PeerLink => ({
  endpointId,
  send: () => Promise.resolve(),
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

  it('takes a share through the log that records it', async () => {
    const trace = await simulate(
      applyPeerMessageSaga({
        endpointId: PEER_ID,
        message: shareMessage('kettle is on'),
      }),
      {
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
