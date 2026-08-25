import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import { createLogger, toError } from '@lib/observability';
import type { HostApi } from '../host-api';
import { createP2pApi, type P2pApi } from './rpc';
import { WorkerSession, type SessionEvents } from './session';

/**
 * The p2p worker: iroh's wasm, the endpoint it binds, and every peer
 * connection riding over it — all on a thread of their own.
 *
 * The page drives it over `@lib/messaging`. What crosses back is plain data,
 * so nothing on the main thread can hold a wasm handle even by accident.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

// The worker global scope is a `MessageEndpoint` as-is — `postMessage(message,
// transfer)` plus `add/removeEventListener`. This file is typed for the worker
// (see `./tsconfig.json`), so `self` reads as a `DedicatedWorkerGlobalScope`
// and satisfies the interface with no cast.
const transport = new MessagePortTransport<RpcMessage, RpcMessage>(self);

/**
 * Announce something to the page, swallowing a failed send.
 *
 * There is no caller to reject and nothing here can act on the failure — the
 * page has either gone away or torn its end down — so it's logged and dropped.
 * Without the catch it would surface as an unhandled rejection instead.
 */
const announce = <Method extends keyof SessionEvents>(
  method: Method,
  ...params: Parameters<SessionEvents[Method]>
): void => {
  void rpc.notify(method, ...(params as [never])).catch((error: unknown) => {
    logger.debug('Could not reach the page.', {
      method,
      error: toError(error),
    });
  });
};

const events: SessionEvents = {
  peerConnected: (peer) => announce('peerConnected', peer),
  peerMessage: (arrival) => announce('peerMessage', arrival),
  peerClosed: (peer) => announce('peerClosed', peer),
  relayChanged: (change) => announce('relayChanged', change),
};

// Anything that escapes a task here would otherwise leave no trace on either
// thread. The page's `error` listener sees uncaught throws only, and by the
// time one crosses a thread boundary it has been flattened to a message with
// no stack; an unhandled rejection doesn't cross at all. Since almost
// everything this worker does is asynchronous — a QUIC read, a relay
// handshake, a dial — the rejection case is the likelier of the two.
self.addEventListener('error', (event) => {
  logger.error('Uncaught error in the p2p worker.', {
    error: toError(event.error ?? event.message),
    filename: event.filename,
    lineno: event.lineno,
  });
});

self.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled rejection in the p2p worker.', {
    error: toError(event.reason),
  });
});

const session = new WorkerSession(events);

// `session` and `rpc` reference each other: the session announces through the
// RPC, and the RPC serves the session's handlers. One of the two has to be
// late-bound, and `announce` is the cheaper half to defer — it only ever runs
// once a peer connects or a message arrives, long after this module finished
// evaluating, so the reference below is always resolved by the time it's read.
const rpc = RPC.from<P2pApi, HostApi, SendOptions>(
  transport,
  createP2pApi(session),
);

/**
 * Instantiate the wasm on load rather than on the first request, so it's warm
 * by the time the page asks for an identity. Once it's live, say so: the host
 * holds every request until `ready` or `failed` lands.
 *
 * A failed init is reported both ways, not swallowed. The worker survives it,
 * so nothing the page listens for on the `Worker` itself fires — it would sit
 * on a handshake that has already lost, with the only account of why in a
 * console it isn't watching.
 */
void WorkerSession.init()
  .then(() => {
    logger.debug('Iroh wasm initialized.');
    // Its own catch rather than riding on init's. A lost `ready` leaves the
    // page waiting forever with nothing ever sent, which is worth telling
    // apart from a wasm module that never came up.
    return rpc.notify('ready').catch((error: unknown) => {
      logger.error('The p2p worker failed to announce readiness.', {
        error: toError(error),
      });
    });
  })
  .catch((error: unknown) => {
    const failure = toError(error);
    logger.error('Iroh wasm failed to initialize.', { error: failure });

    return rpc.notify('failed', { reason: failure.message }).catch(() => {
      // Nothing left to try. Both ends of the report have now failed, and the
      // one above already said so with the stack attached.
    });
  });
