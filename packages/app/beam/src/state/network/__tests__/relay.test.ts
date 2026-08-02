/**
 * Unit tests for coming up: settling this device's identity, joining the
 * relay, and the two loops that run against the endpoint afterwards.
 * Simulated, so every capability is stubbed and the assertions are about what
 * each saga published.
 */

import { createTestRuntime, simulate } from '@lib/state';
import { loadIdentity, openConnection } from '../../platform/iroh';
import { receiveNext, createInbox } from '../../platform/inbox';
import {
  connectFailedTopic,
  connectedTopic,
  connectingTopic,
  connectionStore,
} from '../connection';
import { identityResolvedTopic } from '../../identity';
import {
  connectRelaySaga,
  serveInboundSaga,
  watchRelaySaga,
} from '../sagas/relay';
import { beamScope } from '../../scope';
import type { Endpoint } from '@crate/p2p';
import type { EndpointSession, PeerLink, SelfKey } from '../../platform/iroh';

/**
 * Stand-in endpoint ids for this device and the peer it talks to. Well-formed
 * — 32 bytes of lowercase hex — rather than a readable placeholder, because
 * {@link dialPeerSaga} checks the format before it records anything. A
 * `peer-1` here would be turned away as a malformed link, and every test in
 * this file that expects a dial to do nothing would pass for the wrong reason.
 */
const SELF_ID = `e1${'0'.repeat(62)}`;

/**
 * A stand-in endpoint session. The sagas only read the endpoint's id and drain the
 * peer queue; everything else about one goes through a capability.
 */
const fakeSession: EndpointSession = {
  endpoint: { id: SELF_ID } as Endpoint,
  peers: createInbox<PeerLink>(),
  relay: createInbox<string | null>(),
  release: () => undefined,
};

/** A stand-in identity. Only the address is ever looked at. */
const fakeSelf: SelfKey = {
  endpointId: SELF_ID,
  secretKey: new Uint8Array(32),
};

describe('connectRelaySaga', () => {
  /** A connect nothing has started yet. */
  const idle = () =>
    [
      [
        connectionStore,
        { status: 'connecting', homeRelay: null, started: false },
      ],
    ] as const;

  it('names this device before it joins anything', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [...idle()],
      calls: [
        [loadIdentity, () => fakeSelf],
        [openConnection, () => fakeSession],
      ],
    });

    // Two transitions, and the order is the point: the address is derived
    // from the key, so the header can name this device while the handshake
    // is still a round trip away.
    expect(trace.commits).toEqual([
      [connectingTopic()],
      [identityResolvedTopic(SELF_ID)],
      [connectedTopic(fakeSession)],
    ]);
  });

  it('joins the network under the identity it just settled', async () => {
    const open = vi.fn(() => fakeSession);

    await simulate(connectRelaySaga(), {
      reads: [...idle()],
      calls: [
        [loadIdentity, () => fakeSelf],
        [openConnection, open],
      ],
    });

    expect(open).toHaveBeenCalledWith(expect.any(AbortSignal), fakeSelf);
  });

  it('serves dials, watches the relay, and draws the code', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [...idle()],
      calls: [
        [loadIdentity, () => fakeSelf],
        [openConnection, () => fakeSession],
      ],
    });

    // Nobody can pair with a device that isn't listening, nothing would
    // notice a relay coming and going, and the invite would have no code.
    expect(trace.spawns).toHaveLength(3);
  });

  it('records a failed handshake without stranding the view', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [...idle()],
      calls: [
        [loadIdentity, () => fakeSelf],
        [
          openConnection,
          () => {
            throw new Error('relay unreachable');
          },
        ],
      ],
    });

    // The identity still landed: a device that can't reach a relay still
    // knows what it's called and what its link is.
    expect(trace.commits).toEqual([
      [connectingTopic()],
      [identityResolvedTopic(SELF_ID)],
      [connectFailedTopic()],
    ]);
  });

  it('records a failure that beat the identity', async () => {
    const trace = await simulate(connectRelaySaga(), {
      reads: [...idle()],
      calls: [
        [
          loadIdentity,
          () => {
            throw new Error('wasm blocked');
          },
        ],
        [openConnection, vi.fn()],
      ],
    });

    // Nothing landed but the failure. With no address there is nothing to
    // dial from and nothing to draw a beam link out of.
    expect(trace.commits).toEqual([
      [connectingTopic()],
      [connectFailedTopic()],
    ]);

    expect(trace.spawns).toHaveLength(0);
  });

  it('refuses to open a second endpoint over a live one', async () => {
    const open = vi.fn(() => fakeSession);

    const trace = await simulate(connectRelaySaga(), {
      reads: [
        [
          connectionStore,
          {
            status: 'connected',
            homeRelay: 'https://relay.example',
            started: true,
          },
        ],
      ],
      calls: [
        [loadIdentity, vi.fn()],
        [openConnection, open],
      ],
    });

    // Guarded on `started` rather than the status, which begins already
    // showing a connect under way. The cell holds one endpoint; a second
    // connect would drop the first unfreed.
    expect(open).not.toHaveBeenCalled();
    expect(trace.commits).toEqual([]);
  });
});

describe('watchRelaySaga', () => {
  /**
   * A runtime whose relay queue hands back `changes` in order and then dies,
   * the way a released scope ends the loop. Real rather than simulated: the
   * point is what the header ends up showing, which is state.
   */
  const watching = async (changes: ReadonlyArray<string | null>) => {
    const queued = [...changes];

    const runtime = createTestRuntime({
      calls: [
        [
          receiveNext,
          () => {
            if (queued.length === 0) throw new Error('scope released');
            return queued.shift();
          },
        ],
      ],
    });

    runtime.anchor(beamScope);
    await expect(runtime.run(watchRelaySaga(fakeSession))).rejects.toThrow(
      'scope released',
    );

    return runtime;
  };

  it('mirrors a relay coming up', async () => {
    const { peek } = await watching(['https://relay.example']);

    expect(peek(connectionStore).status).toBe('connected');
    expect(peek(connectionStore).homeRelay).toBe('https://relay.example');
  });

  it('mirrors a relay going away', async () => {
    const { peek } = await watching(['https://relay.example', null]);

    // Back to the spinner, not an error: iroh finds another on its own.
    expect(peek(connectionStore).status).toBe('connecting');
    expect(peek(connectionStore).homeRelay).toBeNull();
  });
});

describe('serveInboundSaga', () => {
  it('drains the queue the session was handed', async () => {
    const receive = vi.fn(() => {
      throw new Error('scope released');
    });

    await expect(
      simulate(serveInboundSaga(fakeSession), {
        calls: [[receiveNext, receive]],
      }),
    ).rejects.toThrow('scope released');

    // The queue is filled by the endpoint's own listener, wired before the
    // connect — so the saga has only to pull from it.
    expect(receive).toHaveBeenCalledWith(
      expect.any(AbortSignal),
      fakeSession.peers,
    );
  });
});
