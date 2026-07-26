/**
 * Unit tests for the beam session's folds — the state transitions a connect
 * publishes, plus the lifetime guarantee the whole app hangs off: the relay is
 * freed when the last anchor is released. Nothing here dereferences the relay,
 * so the tests stand in a fake one.
 */

import { createTestRuntime } from '@lib/state-next';
import type { Relay } from '@crate/iroh';
import {
  connectFailed,
  connected,
  connecting,
  connectionStore,
  relay,
} from '../connection';
import { codeEncoded, qrCode, type QrGrid } from '../qr-code';
import { beamScope } from '../scope';

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
    expect(peek(relay)).toBeNull();
  });
});

describe('connecting', () => {
  it('marks the handshake under way', () => {
    const { commit, peek } = setup();

    commit(connecting());

    expect(peek(connectionStore).status).toBe('connecting');
  });
});

describe('connected', () => {
  it('lands the live endpoint alongside the status', () => {
    const { commit, peek } = setup();
    const endpoint = fakeRelay();

    commit(connected(endpoint));

    expect(peek(connectionStore).status).toBe('connected');
    // Identity, not deep equality: a store would hand back a proxy, and a
    // proxied wasm handle traps on every method call.
    expect(peek(relay)).toBe(endpoint);
  });
});

describe('connectFailed', () => {
  it('lands in a terminal failed state', () => {
    const { commit, peek } = setup();
    commit(connecting());

    commit(connectFailed());

    expect(peek(connectionStore).status).toBe('failed');
  });
});

describe('codeEncoded', () => {
  it('holds the encoded grid', () => {
    const { commit, peek } = setup();

    commit(codeEncoded(fakeGrid));

    expect(peek(qrCode)).toBe(fakeGrid);
  });

  it('leaves the code empty when the encode failed', () => {
    const { commit, peek } = setup();

    commit(codeEncoded(null));

    expect(peek(qrCode)).toBeNull();
  });

  it('lands in the same transition as the connection', () => {
    const { commit, ledger, peek } = setup();
    const endpoint = fakeRelay();

    commit(connected(endpoint), codeEncoded(fakeGrid));

    // One transition, so the view can never paint a connection without its
    // code (nor a code without its connection).
    expect(ledger()).toEqual([[connected(endpoint), codeEncoded(fakeGrid)]]);
    expect(peek(connectionStore).status).toBe('connected');
    expect(peek(qrCode)).toBe(fakeGrid);
  });
});

describe('beamScope', () => {
  it('frees the relay when the last anchor is released', () => {
    const free = vi.fn();
    const { commit, release } = setup();
    commit(connected(fakeRelay(free)));

    release();

    expect(free).toHaveBeenCalledOnce();
  });

  it('keeps the relay alive while another anchor holds the scope', () => {
    const free = vi.fn();
    const { anchor, commit, release } = setup();
    const second = anchor(beamScope);
    commit(connected(fakeRelay(free)));

    release();

    // Navigating between `/beam/*` routes must not tear the relay down.
    expect(free).not.toHaveBeenCalled();

    second();
    expect(free).toHaveBeenCalledOnce();
  });

  it('has nothing to free when no connect landed', () => {
    const { peek, release } = setup();
    // Touch the cell so it materializes and its drop hook actually runs.
    expect(peek(relay)).toBeNull();

    expect(release).not.toThrow();
  });
});
