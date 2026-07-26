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
  connectFailed,
  connected,
  connecting,
  connectionStore,
  relay,
} from '../connection';
import { codeEncoded, type QrGrid } from '../qr-code';
import { connectRelay, dialPeer } from '../sagas';

/** A stand-in endpoint. The sagas only read its id and hand it onward. */
const fakeRelay = { endpointId: 'ep-1' } as Relay;

const fakeGrid: QrGrid = { size: 1, modules: new Uint8Array([1]) };

describe('connectRelay', () => {
  it('lands the relay and its code in one transition', async () => {
    const trace = await simulate(connectRelay(), {
      reads: [[connectionStore, { status: 'initial' }]],
      calls: [
        [openConnection, () => fakeRelay],
        [encodeBeamCode, () => fakeGrid],
      ],
    });

    expect(trace.commits).toEqual([
      [connecting()],
      [connected(fakeRelay), codeEncoded(fakeGrid)],
    ]);
  });

  it('encodes the link for the endpoint it just opened', async () => {
    const encode = vi.fn(() => fakeGrid);

    await simulate(connectRelay(), {
      reads: [[connectionStore, { status: 'initial' }]],
      calls: [
        [openConnection, () => fakeRelay],
        [encodeBeamCode, encode],
      ],
    });

    expect(encode).toHaveBeenCalledWith(expect.any(AbortSignal), 'ep-1');
  });

  it('still lands the connection when the encode found no code', async () => {
    const trace = await simulate(connectRelay(), {
      reads: [[connectionStore, { status: 'initial' }]],
      calls: [
        [openConnection, () => fakeRelay],
        [encodeBeamCode, () => null],
      ],
    });

    // A missing code is non-fatal: the link is still copyable.
    expect(trace.commits).toEqual([
      [connecting()],
      [connected(fakeRelay), codeEncoded(null)],
    ]);
  });

  it('records a failed handshake without stranding the view', async () => {
    const trace = await simulate(connectRelay(), {
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

    expect(trace.commits).toEqual([[connecting()], [connectFailed()]]);
  });

  it('refuses to open a second relay over a live one', async () => {
    const open = vi.fn(() => fakeRelay);

    const trace = await simulate(connectRelay(), {
      reads: [[connectionStore, { status: 'connected' }]],
      calls: [[openConnection, open]],
    });

    // The cell holds one relay; a second connect would drop the first
    // unfreed.
    expect(open).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });
});

describe('dialPeer', () => {
  it('dials over the relay the layout holds open', async () => {
    const dial = vi.fn();

    const trace = await simulate(dialPeer('ep-2'), {
      reads: [[relay, fakeRelay]],
      calls: [[dialEndpoint, dial]],
    });

    expect(dial).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      fakeRelay,
      'ep-2',
    );
    // The dial is pure side effect for now; nothing lands in state.
    expect(trace.commits).toEqual([]);
  });

  it('rejects a dial attempted before the connection is up', async () => {
    await expect(
      simulate(dialPeer('ep-2'), {
        reads: [[relay, null]],
        calls: [[dialEndpoint, vi.fn()]],
      }),
    ).rejects.toThrow('Cannot dial a peer before the relay connection is up.');
  });
});
