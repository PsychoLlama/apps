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
 * holds every request until `ready` lands.
 *
 * A failed init is logged, not swallowed: the worker stays up but every call
 * would trap, so without this the breakage would be invisible.
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
    logger.error('Iroh wasm failed to initialize.', { error: toError(error) });
  });
