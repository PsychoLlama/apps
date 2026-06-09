import init from '@lib/qr-scanner';
import { RPC, type RpcMessage } from '@lib/messaging';
import {
  MessagePortTransport,
  type MessageEndpoint,
  type SendOptions,
} from '@lib/messaging/transport';
import { createLogger, toError } from '@lib/observability';
import type { HostApi } from '../decoder';
import { api, type DecoderApi } from './rpc';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

// `MessagePortTransport` drives any `MessageEndpoint`, and the worker global
// scope is one at runtime: `postMessage(message, transfer)` plus
// `add/removeEventListener`. The cast is only to satisfy the type checker —
// this package is typed for the DOM, so `self` reads as a `Window`, whose
// `postMessage(message, targetOrigin, …)` overload doesn't match. Removing it
// needs a worker-typed lib for `*.worker.ts` (tracked as a followup).
const transport = new MessagePortTransport<RpcMessage, RpcMessage>(
  self as MessageEndpoint,
);

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
