/**
 * Unit tests for the page's end of the p2p worker.
 *
 * These run a real RPC pair over a real `MessageChannel`, with a hand-driven
 * stand-in for the worker on the far end. That's deliberate: what's under test
 * is routing and lifetime — which queue an event lands in, when a link's
 * `closed` settles, what survives a reply arriving after the news it's about —
 * and all of it depends on messages actually crossing a channel in order. A
 * stubbed `rpc.request` would assert the mock rather than the boundary.
 *
 * The worker itself isn't exercised here. It's almost entirely calls into
 * `@crate/p2p`, so testing it would mean mocking the wasm module and asserting
 * that we called it the way we already said we would.
 */

import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import { attachSession, sendMessage, type SessionFeed } from '../iroh';
import { helloMessage } from '../../../protocol';
import {
  createHostHandlers,
  type HostApi,
  type P2pEventSink,
} from '../../../host-api';
import type { P2pApi } from '../../../worker/rpc';

const PEER_ID = `e2${'0'.repeat(62)}`;

/** Handlers the stand-in worker serves. Every one is optional. */
type WorkerHandlers = Partial<{
  loadIdentity: (input: { secretKey?: Uint8Array }) => unknown;
  join: () => unknown;
  dial: (input: { endpointId: string }) => unknown;
  send: (input: { peerId: string; message: unknown }) => unknown;
}>;

/**
 * Wire a session to a stand-in worker over a real channel.
 *
 * Returns the session plus the handles a test needs to play the other end:
 * `emit` to announce something the way the worker would, and `received` to see
 * what the page asked for.
 */
const setup = (handlers: WorkerHandlers = {}) => {
  const channel = new MessageChannel();
  const received: Array<{ method: string; params: unknown }> = [];

  const record =
    <Input>(method: string, handler?: (input: Input) => unknown) =>
    (params: Input) => {
      received.push({ method, params });
      if (!handler) throw new Error(`No stubbed handler for ${method}.`);
      return handler(params);
    };

  // The page's end, wired exactly as `startP2p` wires it: the handlers are
  // installed once and read the sink slot on every event, so the session
  // attached below is what they route to.
  let sink: SessionFeed | undefined;
  const host = RPC.from<HostApi, P2pApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(channel.port1),
    createHostHandlers({
      onReady: () => undefined,
      onFailed: () => undefined,
      sink: () => sink,
    }),
  );

  // The stand-in worker. `notify`-only methods are recorded and ignored, which
  // is all a real one does with them from the page's point of view.
  const worker = RPC.from<P2pApi, HostApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(channel.port2),
    {
      requests: {
        loadIdentity: record('loadIdentity', handlers.loadIdentity),
        join: record('join', handlers.join),
        dial: record('dial', handlers.dial),
        send: record('send', handlers.send),
      },
      events: {
        release: record('release', () => undefined),
        leave: record('leave', () => undefined),
      },
    } as never,
  );

  // A `MessagePort` stays dormant until started — unlike a `Worker`, which
  // delivers on its own. Without these the first request would post and never
  // arrive.
  channel.port1.start();
  channel.port2.start();

  const session = attachSession(host, (installed) => {
    sink = installed;
  });

  return {
    session,
    received,

    /** Announce something the way the worker would. */
    emit: <Method extends keyof P2pEventSink>(
      method: Method,
      ...params: Parameters<P2pEventSink[Method]>
    ) => void worker.notify(method, ...(params as [never])),

    /**
     * Report the thread gone, the way the host does when the `Worker` fires
     * `error`. Not something the worker can send — it's dead.
     */
    lose: () => sink?.lost(),
  };
};

/** Let the channel drain — delivery is a task, not a microtask. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('attachSession', () => {
  it('queues an inbound peer for the accept loop', async () => {
    const { session, emit } = setup();

    emit('peerConnected', { peerId: 'peer-1', endpointId: PEER_ID });
    await tick();

    const link = await session.peers.next(new AbortController().signal);
    expect(link.endpointId).toBe(PEER_ID);
  });

  it('does not queue a dialled peer for the accept loop', async () => {
    const { session } = setup({
      dial: () => ({ peerId: 'peer-1', endpointId: PEER_ID }),
    });

    await session.dial(PEER_ID);
    await tick();

    // A peer this device went looking for must not reach the accept loop, or
    // it would be greeted as though it had turned up on its own.
    const abort = new AbortController();
    abort.abort(new Error('nothing queued'));
    await expect(session.peers.next(abort.signal)).rejects.toThrow(
      'nothing queued',
    );
  });

  it('keeps a message that arrives before the dial it belongs to', async () => {
    // The race this whole registry exists for. The worker starts reading off a
    // connection as soon as it has one, so a frame can be announced before the
    // reply naming that peer has crossed — and the page must not drop it.
    const { session, emit } = setup({
      dial: () => {
        emit('peerMessage', {
          peerId: 'peer-1',
          message: helloMessage('early bird'),
        });

        return { peerId: 'peer-1', endpointId: PEER_ID };
      },
    });

    const link = await session.dial(PEER_ID);
    await tick();

    const message = await link.messages.next(new AbortController().signal);
    expect(message).toEqual(helloMessage('early bird'));
  });

  it('settles a link that closed before the dial it belongs to', async () => {
    const { session, emit } = setup({
      dial: () => {
        emit('peerClosed', { peerId: 'peer-1' });
        return { peerId: 'peer-1', endpointId: PEER_ID };
      },
    });

    const link = await session.dial(PEER_ID);
    await tick();

    // Already settled rather than lost: the saga watching this link commits
    // the close on its first step instead of parking forever.
    await expect(link.closed).resolves.toBeUndefined();
  });

  it('settles a link when the worker says it closed', async () => {
    const { session, emit } = setup({
      dial: () => ({ peerId: 'peer-1', endpointId: PEER_ID }),
    });
    const link = await session.dial(PEER_ID);

    emit('peerClosed', { peerId: 'peer-1' });

    await expect(link.closed).resolves.toBeUndefined();
  });

  it('settles a released link without waiting for the worker', async () => {
    const { session, received } = setup({
      dial: () => ({ peerId: 'peer-1', endpointId: PEER_ID }),
    });
    const link = await session.dial(PEER_ID);

    link.release();

    // Hanging up is this device's own decision, so the saga parked on `closed`
    // hears about it now rather than after a round trip.
    await expect(link.closed).resolves.toBeUndefined();

    await tick();
    expect(received.map((call) => call.method)).toContain('release');
  });

  it('settles every open link when the worker dies', async () => {
    const { session, emit, lose } = setup({
      dial: () => ({ peerId: 'peer-1', endpointId: PEER_ID }),
    });
    const dialled = await session.dial(PEER_ID);

    emit('peerConnected', { peerId: 'peer-2', endpointId: PEER_ID });
    await tick();
    const inbound = await session.peers.next(new AbortController().signal);

    lose();

    // A dead thread announces nothing, so no `peerClosed` is ever coming for
    // these. Without settling them here every `watchPeerSaga` parks for the
    // life of the page and the peer list never empties.
    await expect(dialled.closed).resolves.toBeUndefined();
    await expect(inbound.closed).resolves.toBeUndefined();
  });

  it('drops the relay when the worker dies', async () => {
    const { session, emit, lose } = setup();
    const signal = new AbortController().signal;

    emit('relayChanged', { homeRelay: 'https://relay.example' });
    await expect(session.relay.next(signal)).resolves.toBe(
      'https://relay.example',
    );

    lose();

    // Otherwise the status bar goes on claiming a relay nothing is holding.
    await expect(session.relay.next(signal)).resolves.toBeNull();
  });

  it('reports the relay coming and going', async () => {
    const { session, emit } = setup();
    const signal = new AbortController().signal;

    emit('relayChanged', { homeRelay: 'https://relay.example' });
    await expect(session.relay.next(signal)).resolves.toBe(
      'https://relay.example',
    );

    emit('relayChanged', { homeRelay: null });
    await expect(session.relay.next(signal)).resolves.toBeNull();
  });

  it('stops routing once the session is released', async () => {
    const { session, emit } = setup();

    session.release();
    emit('relayChanged', { homeRelay: 'https://relay.example' });
    await tick();

    // The queues belong to a session nobody is holding. An event landing after
    // the release would be filed against a visit that already ended.
    const abort = new AbortController();
    abort.abort(new Error('nothing queued'));
    await expect(session.relay.next(abort.signal)).rejects.toThrow(
      'nothing queued',
    );
  });

  it('asks the worker to leave when the session is released', async () => {
    const { session, received } = setup();

    session.release();
    await tick();

    // What keeps peers from waiting out an idle timeout: the endpoint closes
    // its connections deliberately rather than the thread being killed.
    expect(received.map((call) => call.method)).toContain('leave');
  });

  it('sends a message over the link it belongs to', async () => {
    const send = vi.fn();
    const { session } = setup({
      dial: () => ({ peerId: 'peer-1', endpointId: PEER_ID }),
      send,
    });

    const link = await session.dial(PEER_ID);
    await link.send(helloMessage('hi'));

    expect(send).toHaveBeenCalledWith({
      peerId: 'peer-1',
      message: helloMessage('hi'),
    });
  });
});

describe('sendMessage', () => {
  it('reports a send that landed', async () => {
    const { session } = setup({
      dial: () => ({ peerId: 'peer-1', endpointId: PEER_ID }),
      send: () => undefined,
    });
    const link = await session.dial(PEER_ID);

    const signal = new AbortController().signal;
    await expect(sendMessage(signal, link, helloMessage('hi'))).resolves.toBe(
      true,
    );
  });

  it('reports a failed send rather than throwing', async () => {
    const { session } = setup({
      dial: () => ({ peerId: 'peer-1', endpointId: PEER_ID }),
      send: () => {
        throw new Error('connection gone');
      },
    });
    const link = await session.dial(PEER_ID);

    // Load-bearing: `flushSharesSaga` and `linkPeerSaga` don't catch, so a
    // rejection here would fail the saga that greets an inbound peer. Crossing
    // a thread added three new ways to fail, and all of them fold to this.
    const signal = new AbortController().signal;
    await expect(sendMessage(signal, link, helloMessage('hi'))).resolves.toBe(
      false,
    );
  });
});
