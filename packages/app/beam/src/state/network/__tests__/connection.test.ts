/**
 * Unit tests for the relay connection's folds — the state transitions a
 * connect publishes, plus the lifetime guarantee the whole app hangs off: the
 * session is released when the last anchor is. Nothing here
 * asks the worker for anything, so the tests stand in a fake session.
 */

import { createTestRuntime } from '@lib/state';
import type { P2pSession, PeerLink } from '../../platform/iroh';
import { createInbox } from '../../platform/inbox';
import {
  connectFailedTopic,
  connectedTopic,
  connectingTopic,
  connectionStore,
  p2pStartedTopic,
  sessionCell,
  relayChangedTopic,
} from '../connection';
import { identityResolvedTopic, identityStore } from '../../identity';
import { beamScope } from '../../scope';

/**
 * A stand-in session. Only `release` is ever called, and only on teardown —
 * nothing here asks the worker to do anything.
 */
const fakeSession = (release: () => void = () => undefined): P2pSession => ({
  peers: createInbox<PeerLink>(),
  relay: createInbox<string | null>(),
  loadIdentity: () => Promise.reject(new Error('not used')),
  join: () => Promise.reject(new Error('not used')),
  dial: () => Promise.reject(new Error('not used')),
  release,
});

const setup = () => {
  const runtime = createTestRuntime();
  const release = runtime.anchor(beamScope);
  return { ...runtime, release };
};

describe('connectionStore', () => {
  it('seeds a connecting status and no session before a connect', () => {
    const { peek } = setup();

    // The spinner is the prerendered state: connecting starts on mount and
    // nothing cancels it, so an idle status would only ever be a lie the
    // markup told for a frame.
    expect(peek(connectionStore).status).toBe('connecting');
    expect(peek(connectionStore).homeRelay).toBeNull();
    expect(peek(sessionCell)).toBeNull();
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

describe('p2pStartedTopic', () => {
  it('holds the session without claiming a connection', () => {
    const { commit, peek } = setup();
    const session = fakeSession();

    commit(p2pStartedTopic(session));

    // Identity, not deep equality: a store would hand back a proxy, and a
    // proxied session's methods would be called on the wrong object.
    expect(peek(sessionCell)).toBe(session);
    // The worker being up says nothing about the relay. The handshake is
    // still ahead, and the header must go on showing a connect under way.
    expect(peek(connectionStore).status).toBe('connecting');
  });
});

describe('connectedTopic', () => {
  it('marks the connection live', () => {
    const { commit, peek } = setup();
    commit(p2pStartedTopic(fakeSession()));

    commit(connectedTopic());

    expect(peek(connectionStore).status).toBe('connected');
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
    expect(peek(sessionCell)).toBeNull();
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

describe('beamScope', () => {
  it('releases the session when the last anchor is released', () => {
    const dispose = vi.fn();
    const { commit, release } = setup();
    commit(p2pStartedTopic(fakeSession(dispose)));

    release();

    expect(dispose).toHaveBeenCalledOnce();
  });

  it('keeps the session alive while another anchor holds the scope', () => {
    const dispose = vi.fn();
    const { anchor, commit, release } = setup();
    const second = anchor(beamScope);
    commit(p2pStartedTopic(fakeSession(dispose)));

    release();

    // Navigating between `/beam/*` routes must not tear the session down.
    expect(dispose).not.toHaveBeenCalled();

    second();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('has nothing to release when no connect landed', () => {
    const { peek, release } = setup();
    // Touch the cell so it materializes and its drop hook actually runs.
    expect(peek(sessionCell)).toBeNull();

    expect(release).not.toThrow();
  });
});
