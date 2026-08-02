/**
 * Unit tests for the beam session's folds — the state transitions a connect
 * publishes, plus the lifetime guarantee the whole app hangs off: the endpoint is
 * freed when the last anchor is released. Nothing here dereferences the endpoint,
 * so the tests stand in a fake one.
 */

import { createTestRuntime } from '@lib/state';
import type { Endpoint } from '@crate/p2p';
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
import {
  identityAbsentTopic,
  identityFailedTopic,
  identityResolvedTopic,
  identityStore,
  selfLabelFormula,
} from '../identity';
import { codeEncodedTopic, qrCodeCell, type QrGrid } from '../qr-code';
import { generateLabel } from '../../labels';
import { beamScope } from '../../scope';

/** A well-formed endpoint id, for the tests that read a name out of one. */
const SELF_ID = `e1${'0'.repeat(62)}`;

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

describe('identityStore', () => {
  it('knows nothing about this device before the vault answers', () => {
    const { peek } = setup();

    // Not `absent`: that's a claim about the device, and prerender is in no
    // position to make one. Onboarding hangs off `absent`, so seeding it
    // would offer a fresh key to every device on first paint.
    expect(peek(identityStore).status).toBe('pending');
    expect(peek(identityStore).endpointId).toBeNull();
  });
});

describe('identityResolvedTopic', () => {
  it('names this device before any connection lands', () => {
    const { commit, peek } = setup();

    commit(identityResolvedTopic({ endpointId: 'ep-1', label: null }));

    expect(peek(identityStore).status).toBe('ready');
    expect(peek(identityStore).endpointId).toBe('ep-1');
    // The whole point of splitting it out: the address is readable from the
    // key alone, with no relay involved.
    expect(peek(connectionStore).status).toBe('connecting');
    expect(peek(endpointCell)).toBeNull();
  });

  it('holds the chosen name against the same rule every name obeys', () => {
    const { commit, peek } = setup();

    commit(identityResolvedTopic({ endpointId: 'ep-1', label: '  Studio  ' }));

    expect(peek(identityStore).label).toBe('Studio');
    expect(peek(selfLabelFormula)).toBe('Studio');
  });

  it('falls back to the key prefix when the name is unrecoverable', () => {
    const { commit, peek } = setup();

    commit(identityResolvedTopic({ endpointId: SELF_ID, label: null }));

    // Setting a device up requires a name, so this is the vault having lost
    // one and kept the key. The device still has a name — the start of its
    // own key, the same as an unnamed contact.
    expect(peek(identityStore).label).toBeNull();
    expect(peek(selfLabelFormula)).toBe(generateLabel(SELF_ID));
  });
});

describe('identityAbsentTopic', () => {
  it('marks a device that has never been set up', () => {
    const { commit, peek } = setup();

    commit(identityAbsentTopic());

    expect(peek(identityStore).status).toBe('absent');
    expect(peek(identityStore).endpointId).toBeNull();
  });

  it('puts the connection back where it started', () => {
    const { commit, peek } = setup();
    commit(connectingTopic());

    commit(identityAbsentTopic());

    // Setting the device up is itself a connect, and it's guarded on this
    // flag. Left set, the first attempt would be turned away as a duplicate
    // of the attempt that discovered there was nothing to attempt.
    expect(peek(connectionStore).started).toBe(false);
    expect(peek(connectionStore).status).toBe('connecting');
    expect(peek(connectionStore).homeRelay).toBeNull();
  });
});

describe('identityFailedTopic', () => {
  it('keeps an unreadable key apart from a missing one', () => {
    const { commit, peek } = setup();

    commit(identityFailedTopic());

    // `failed`, not `absent`. We don't know whether there's a key, and
    // rendering onboarding here would offer to mint a second identity over
    // the top of a working one.
    expect(peek(identityStore).status).toBe('failed');
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

    commit(identityResolvedTopic({ endpointId: 'ep-1', label: null }));
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
