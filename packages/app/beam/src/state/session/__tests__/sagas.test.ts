/**
 * Unit tests for the beam session's sagas. These run under `simulate`, so
 * there's no runtime and no state — every capability is stubbed and the
 * assertions are about what the saga published, which is exactly where the
 * one-transition guarantee lives.
 */

import { simulate } from '@lib/state-next';
import type { Relay } from '@crate/iroh';
import { dialEndpoint, encodeBeamCode, openConnection } from '../capabilities';
import {
  connectFailedTopic,
  connectedTopic,
  connectingTopic,
  connectionStore,
  relayCell,
} from '../connection';
import { codeEncodedTopic, type QrGrid } from '../qr-code';
import { connectRelaySaga, dialPeerSaga } from '../sagas';
import { now, saveContact } from '../../contacts/capabilities';
import { contactSeenTopic, contactsStore } from '../../contacts/contacts';

/** A stand-in endpoint. The sagas only read its id and hand it onward. */
const fakeRelay = { endpointId: 'ep-1' } as Relay;

const fakeGrid: QrGrid = { size: 1, modules: new Uint8Array([1]) };

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

describe('dialPeerSaga', () => {
  /** Stubs for the address-book write the dial records on its way out. */
  const bookkeeping = () =>
    [
      [now, () => 1234],
      [saveContact, vi.fn()],
    ] as const;

  it('dials over the relay the layout holds open', async () => {
    const dial = vi.fn();

    await simulate(dialPeerSaga('ep-2'), {
      reads: [
        [relayCell, fakeRelay],
        [contactsStore, { status: 'ready', entries: {} }],
      ],
      calls: [...bookkeeping(), [dialEndpoint, dial]],
    });

    expect(dial).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      fakeRelay,
      'ep-2',
    );
  });

  it('records the peer before dialling it', async () => {
    const trace = await simulate(dialPeerSaga('ep-2'), {
      reads: [
        [relayCell, fakeRelay],
        [contactsStore, { status: 'ready', entries: {} }],
      ],
      calls: [...bookkeeping(), [dialEndpoint, vi.fn()]],
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
    ]);
  });

  it('does nothing when handed this device’s own beam link', async () => {
    const dial = vi.fn();

    const trace = await simulate(dialPeerSaga('ep-1'), {
      reads: [[relayCell, fakeRelay]],
      calls: [...bookkeeping(), [dialEndpoint, dial]],
    });

    // Scanning your own code shouldn't dial yourself or leave a contact for
    // this very device in the book.
    expect(dial).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
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
