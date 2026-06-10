import init from '@crate/qr-scanner';
import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import { createLogger, toError } from '@lib/observability';
import type { HostApi } from '../host-api';
import { api, type DecoderApi } from './rpc';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

// The worker global scope is a `MessageEndpoint` as-is — `postMessage(message,
// transfer)` plus `add/removeEventListener`. This file is typed for the worker
// (see `src/worker/tsconfig.json`), so `self` reads as a
// `DedicatedWorkerGlobalScope` and satisfies the interface with no cast.
const transport = new MessagePortTransport<RpcMessage, RpcMessage>(self);

const rpc = RPC.from<DecoderApi, HostApi, SendOptions>(transport, api);

/**
 * Eagerly initialize the wasm module on worker load — not lazily on the first
 * frame — so it's warm by the time the camera goes live. Once it's live,
 * announce `ready`: the host holds its first frame until that event lands.
 *
 * A failed init is logged, not swallowed: the worker stays up but every
 * `decode` would trap, so without this the breakage would be invisible.
 */
void init().then(
  () => {
    logger.debug('Decoder wasm initialized.');
    rpc.notify('ready');
  },
  (error: unknown) => {
    logger.error('Decoder wasm failed to initialize.', {
      error: toError(error),
    });
  },
);
