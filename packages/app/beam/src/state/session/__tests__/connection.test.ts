/**
 * Unit tests for the beam session's folds — the state transitions a connect
 * publishes, plus the lifetime guarantee the whole app hangs off: the relay is
 * freed when the last anchor is released. Nothing here dereferences the relay,
 * so the tests stand in a fake one.
 */

import { createTestRuntime } from '@lib/state';
import type { Relay } from '@crate/iroh';
import {
  connectFailedTopic,
  connectedTopic,
  connectingTopic,
  connectionStore,
  relayCell,
} from '../connection';
import { codeEncodedTopic, qrCodeCell, type QrGrid } from '../qr-code';
import { beamScope } from '../../scope';

/** A stand-in endpoint. Only `free` is ever called, and only on teardown. */
const fakeRelay = (free: () => void = () => undefined): Relay =>
  ({ free }) as Relay;

const fakeGrid: QrGrid = { size: 1, modules: new Uint8Array([1]) };

const setup = () => {
  const runtime = createTestRuntime();
  const release = runtime.anchor(beamScope);
  return { ...runtime, release };
};

describe('connectionStore', () => {
  it('seeds an idle status and no relay before a connect', () => {
    const { peek } = setup();

    expect(peek(connectionStore).status).toBe('initial');
    expect(peek(relayCell)).toBeNull();
  });
});

describe('connectingTopic', () => {
  it('marks the handshake under way', () => {
    const { commit, peek } = setup();

    commit(connectingTopic());

    expect(peek(connectionStore).status).toBe('connecting');
  });
});

describe('connectedTopic', () => {
  it('lands the live endpoint alongside the status', () => {
    const { commit, peek } = setup();
    const endpoint = fakeRelay();

    commit(connectedTopic(endpoint));

    expect(peek(connectionStore).status).toBe('connected');
    // Identity, not deep equality: a store would hand back a proxy, and a
    // proxied wasm handle traps on every method call.
    expect(peek(relayCell)).toBe(endpoint);
  });
});

describe('connectFailedTopic', () => {
  it('lands in a terminal failed state', () => {
    const { commit, peek } = setup();
    commit(connectingTopic());

    commit(connectFailedTopic());

    expect(peek(connectionStore).status).toBe('failed');
  });
});

describe('codeEncodedTopic', () => {
  it('holds the encoded grid', () => {
    const { commit, peek } = setup();

    commit(codeEncodedTopic(fakeGrid));

    expect(peek(qrCodeCell)).toBe(fakeGrid);
  });

  it('leaves the code empty when the encode failed', () => {
    const { commit, peek } = setup();

    commit(codeEncodedTopic(null));

    expect(peek(qrCodeCell)).toBeNull();
  });

  it('lands in the same transition as the connection', () => {
    const { commit, ledger, peek } = setup();
    const endpoint = fakeRelay();

    commit(connectedTopic(endpoint), codeEncodedTopic(fakeGrid));

    // One transition, so the view can never paint a connection without its
    // code (nor a code without its connection).
    expect(ledger()).toEqual([
      [connectedTopic(endpoint), codeEncodedTopic(fakeGrid)],
    ]);
    expect(peek(connectionStore).status).toBe('connected');
    expect(peek(qrCodeCell)).toBe(fakeGrid);
  });
});

describe('beamScope', () => {
  it('frees the relay when the last anchor is released', () => {
    const free = vi.fn();
    const { commit, release } = setup();
    commit(connectedTopic(fakeRelay(free)));

    release();

    expect(free).toHaveBeenCalledOnce();
  });

  it('keeps the relay alive while another anchor holds the scope', () => {
    const free = vi.fn();
    const { anchor, commit, release } = setup();
    const second = anchor(beamScope);
    commit(connectedTopic(fakeRelay(free)));

    release();

    // Navigating between `/beam/*` routes must not tear the relay down.
    expect(free).not.toHaveBeenCalled();

    second();
    expect(free).toHaveBeenCalledOnce();
  });

  it('has nothing to free when no connect landed', () => {
    const { peek, release } = setup();
    // Touch the cell so it materializes and its drop hook actually runs.
    expect(peek(relayCell)).toBeNull();

    expect(release).not.toThrow();
  });
});
