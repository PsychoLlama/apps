import init, { Device } from '@crate/beam';
import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import { createLogger, toError } from '@lib/observability';
import type { HostApi } from '../host-api';
import { Engine, type EngineEvents } from '../engine/engine';
import { openOverLegacy } from '../platform/legacy-store';
import { inferDeviceName } from '../state/device-name';
import { createEngineApi, type EngineApi } from './rpc';

/**
 * The device worker: the database, the endpoint, and every connection
 * riding over it, on a thread of their own.
 *
 * The page drives it over `@lib/messaging`. Nothing is announced on load:
 * requests posted before this module evaluates queue on the port, and the
 * engine instantiates the wasm itself before the first open.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

// The worker global scope is a `MessageEndpoint` as-is. This file is typed
// for the worker (see `./tsconfig.json`), so `self` reads as a
// `DedicatedWorkerGlobalScope` and satisfies the interface with no cast.
const transport = new MessagePortTransport<RpcMessage, RpcMessage>(self);

/**
 * Announce something to the page, swallowing a failed send. There is no
 * caller to reject and nothing here can act on the failure: the page has
 * gone away or torn its end down.
 */
const announce = <Method extends keyof EngineEvents>(
  method: Method,
  ...params: Parameters<EngineEvents[Method]>
): void => {
  void rpc.notify(method, ...(params as [never])).catch((error: unknown) => {
    logger.debug('Could not reach the page.', {
      method,
      error: toError(error),
    });
  });
};

const engine = new Engine(
  {
    locks: navigator.locks,
    init: () => init(),

    // An earlier Beam's database under this name would refuse the open.
    openDevice: (store, onRelayChange, onChange, onFault) =>
      openOverLegacy(store, () =>
        Device.open(store, onRelayChange, onChange, onFault),
      ),
    defaultDeviceName: () => inferDeviceName(navigator.userAgent),
  },
  {
    opened: (device) => announce('opened', device),
    heldElsewhere: () => announce('heldElsewhere'),
    openFailed: (failure) => announce('openFailed', failure),
    relayChanged: (change) => announce('relayChanged', change),
    groupsChanged: (change) => announce('groupsChanged', change),
    feedChanged: (change) => announce('feedChanged', change),
    membersChanged: (change) => announce('membersChanged', change),
  },
);

// Anything that escapes a task here would otherwise leave no trace on
// either thread: an unhandled rejection doesn't cross the boundary at all,
// and almost everything this worker does is asynchronous.
self.addEventListener('error', (event) => {
  logger.error('Uncaught error in the device worker.', {
    error: toError(event.error ?? event.message),
    filename: event.filename,
    lineno: event.lineno,
  });
});

self.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled rejection in the device worker.', {
    error: toError(event.reason),
  });
});

// `engine` and `rpc` reference each other: the engine announces through
// the RPC, and the RPC serves the engine's handlers. `announce` is the
// half that's late-bound, since it only runs once something has happened.
const rpc = RPC.from<EngineApi, HostApi, SendOptions>(
  transport,
  createEngineApi(engine, () => self.close()),
);
