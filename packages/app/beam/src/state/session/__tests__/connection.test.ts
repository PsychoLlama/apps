/**
 * Unit tests for the beam session's folds — the state transitions a connect
 * publishes, plus the lifetime guarantee the whole app hangs off: the endpoint is
 * freed when the last anchor is released. Nothing here dereferences the endpoint,
 * so the tests stand in a fake one.
 */

import { createTestRuntime } from '@lib/state';
import type { Endpoint } from '@crate/iroh';
import type { PeerLink, EndpointSession } from '../capabilities';
import { createInbox } from '../inbox';
import {
  connectFailedTopic,
  connectedTopic,
  connectingTopic,
  connectionStore,
  endpointCell,
} from '../connection';
import { codeEncodedTopic, qrCodeCell, type QrGrid } from '../qr-code';
import { beamScope } from '../../scope';

/**
 * A stand-in endpoint session. Only `release` is ever called, and only on
 * teardown — nothing here dereferences the endpoint itself.
 */
const fakeSession = (
  release: () => void = () => undefined,
): EndpointSession => ({
  endpoint: { id: 'ep-1' } as Endpoint,
  peers: createInbox<PeerLink>(),
  release,
});

const fakeGrid: QrGrid = { size: 1, modules: new Uint8Array([1]) };

const setup = () => {
  const runtime = createTestRuntime();
  const release = runtime.anchor(beamScope);
  return { ...runtime, release };
};

describe('connectionStore', () => {
  it('seeds an idle status and no endpoint before a connect', () => {
    const { peek } = setup();

    expect(peek(connectionStore).status).toBe('initial');
    expect(peek(endpointCell)).toBeNull();
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
    const endpoint = fakeSession();

    commit(connectedTopic(endpoint));

    expect(peek(connectionStore).status).toBe('connected');
    // Identity, not deep equality: a store would hand back a proxy, and a
    // proxied wasm handle traps on every method call.
    expect(peek(endpointCell)).toBe(endpoint);
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
    const endpoint = fakeSession();

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
  it('releases the endpoint when the last anchor is released', () => {
    const dispose = vi.fn();
    const { commit, release } = setup();
    commit(connectedTopic(fakeSession(dispose)));

    release();

    expect(dispose).toHaveBeenCalledOnce();
  });

  it('keeps the endpoint alive while another anchor holds the scope', () => {
    const dispose = vi.fn();
    const { anchor, commit, release } = setup();
    const second = anchor(beamScope);
    commit(connectedTopic(fakeSession(dispose)));

    release();

    // Navigating between `/beam/*` routes must not tear the endpoint down.
    expect(dispose).not.toHaveBeenCalled();

    second();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('has nothing to release when no connect landed', () => {
    const { peek, release } = setup();
    // Touch the cell so it materializes and its drop hook actually runs.
    expect(peek(endpointCell)).toBeNull();

    expect(release).not.toThrow();
  });
});
