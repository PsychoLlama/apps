import { RPC, type RpcApi, type RpcMessage } from './rpc.ts';
import { fromMessagePort, type MessageEndpoint } from './message-channel.ts';

export * from './message-channel.ts';

/**
 * {@link RPC} bound to a `MessagePort`-shaped endpoint — the common case.
 * Wraps {@link fromMessagePort} so you don't compose the adapter by hand,
 * and inherits transfer support: list buffers in a call's `transfer` option
 * and they move to the peer by reference.
 *
 * Like the adapter, this does not `start()` the endpoint — when delivery
 * begins is the consumer's to time. For a custom (non-port) transport, wrap
 * it as a {@link Channel} and use {@link RPC.from} instead.
 *
 * @example
 * ```ts
 * const { port1, port2 } = new MessageChannel();
 * const rpc = new PortRpc<LocalApi, RemoteApi>(port1, {
 *   requests: { add: ({ left, right }) => left + right },
 *   events: {},
 * });
 * port1.start(); // begin delivery when ready
 * worker.postMessage({ port: port2 }, [port2]);
 * ```
 */
export class PortRpc<Local extends RpcApi, Remote extends RpcApi> extends RPC<
  Local,
  Remote
> {
  constructor(endpoint: MessageEndpoint, handlers: Local) {
    super(fromMessagePort<RpcMessage, RpcMessage>(endpoint), handlers);
  }
}
