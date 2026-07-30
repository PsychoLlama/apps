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
  relayChangedTopic,
} from '../connection';
import { identityResolvedTopic, identityStore } from '../identity';
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
  relay: createInbox<string | null>(),
  release,
});

const fakeGrid: QrGrid = { size: 1, modules: new Uint8Array([1]) };

const setup = () => {
  const runtime = createTestRuntime();
  const release = runtime.anchor(beamScope);
  return { ...runtime, release };
};

describe('connectionStore', () => {
  it('seeds a connecting status and no endpoint before a connect', () => {
    const { peek } = setup();

    // The spinner is the prerendered state: connecting starts on mount and
    // nothing cancels it, so an idle status would only ever be a lie the
    // markup told for a frame.
    expect(peek(connectionStore).status).toBe('connecting');
    expect(peek(connectionStore).homeRelay).toBeNull();
    expect(peek(endpointCell)).toBeNull();
  });

  it('has not started a connect until something says so', () => {
    const { commit, peek } = setup();

    expect(peek(connectionStore).started).toBe(false);

    commit(connectingTopic());

    // The guard the status can no longer serve, now that it starts already
    // showing a connect under way.
    expect(peek(connectionStore).started).toBe(true);
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

describe('relayChangedTopic', () => {
  it('names the relay carrying the endpoint', () => {
    const { commit, peek } = setup();

    commit(relayChangedTopic('https://relay.example'));

    expect(peek(connectionStore).status).toBe('connected');
    expect(peek(connectionStore).homeRelay).toBe('https://relay.example');
  });

  it('falls back to connecting when the relay goes away', () => {
    const { commit, peek } = setup();
    commit(relayChangedTopic('https://relay.example'));

    commit(relayChangedTopic(null));

    // Not a failure: iroh goes and finds another relay on its own, so this
    // is the same news the first handshake was.
    expect(peek(connectionStore).status).toBe('connecting');
    expect(peek(connectionStore).homeRelay).toBeNull();
  });

  it('leaves a failed connect alone', () => {
    const { commit, peek } = setup();
    commit(connectFailedTopic());

    commit(relayChangedTopic('https://relay.example'));

    // The endpoint behind a failure is gone. A late change from a watcher
    // still unwinding would have the header claim a connection nothing holds.
    expect(peek(connectionStore).status).toBe('failed');
    expect(peek(connectionStore).homeRelay).toBeNull();
  });
});

describe('identityResolvedTopic', () => {
  it('names this device before any connection lands', () => {
    const { commit, peek } = setup();

    commit(identityResolvedTopic('ep-1'));

    expect(peek(identityStore).endpointId).toBe('ep-1');
    // The whole point of splitting it out: the address is readable from the
    // key alone, with no relay involved.
    expect(peek(connectionStore).status).toBe('connecting');
    expect(peek(endpointCell)).toBeNull();
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

  it('lands without waiting for the relay connection', () => {
    const { commit, peek } = setup();

    commit(identityResolvedTopic('ep-1'));
    commit(codeEncodedTopic(fakeGrid));

    // The code encodes the link, and the link is the address the key
    // implies — so the invite is complete before the handshake is.
    expect(peek(qrCodeCell)).toBe(fakeGrid);
    expect(peek(endpointCell)).toBeNull();
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
