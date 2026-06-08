import { createLogger } from '@lib/observability';
import type { Channel } from './channel.ts';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * A single RPC procedure. Takes at most one `params` argument and returns
 * a result. Requests return a value (sync or `Promise`); events return
 * `void`. The `never` param is a constraint trick — every concrete
 * procedure of arity 0 or 1 is assignable to it, while arity 2+ is not.
 */
export type RpcProcedure = (params: never) => unknown;

/**
 * Describes one endpoint's procedures, split by call style.
 *
 * - `requests` expect a response — the caller awaits a result and a
 *   throwing handler rejects the caller's promise.
 * - `events` are fire-and-forget — no response, no result.
 *
 * Use inline object types for each map; both are required (pass `{}` when
 * an endpoint exposes none). A procedure may take zero or one argument,
 * never more.
 */
export interface RpcApi {
  requests: Record<string, RpcProcedure>;
  events: Record<string, RpcProcedure>;
}

/** Error raised on the caller side when a remote request fails. */
export class RpcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RpcError';
  }
}

/**
 * The wire envelope carried by the underlying {@link Channel}. An `RPC`
 * owns its channel end-to-end, so the channel is always typed
 * `Channel<RpcMessage, RpcMessage>` — these are the only messages on it.
 *
 * `id` correlates a response back to its request. Events carry no `id`
 * because nothing awaits them.
 */
export type RpcMessage =
  | { type: 'request'; id: number; method: string; params: unknown }
  | { type: 'response'; id: number; ok: true; result: unknown }
  | { type: 'response'; id: number; ok: false; error: { message: string } }
  | { type: 'event'; method: string; params: unknown };

type ResultOf<Procedure extends RpcProcedure> = Awaited<ReturnType<Procedure>>;

type RequestMethod<Api extends RpcApi> = keyof Api['requests'] & string;
type EventMethod<Api extends RpcApi> = keyof Api['events'] & string;

/**
 * Resolve a handler by method name, treating the name as untrusted.
 *
 * Inbound `method` strings may come from an untrusted peer (a foreign
 * origin, the network). A bare index would let `constructor`, `__proto__`,
 * `toString`, etc. resolve to inherited members of the handler object —
 * invoking code the `RpcApi` never declared. Restricting to own properties
 * means only declared procedures are reachable.
 */
const findHandler = (
  handlers: Record<string, RpcProcedure | undefined>,
  method: string,
): RpcProcedure | undefined =>
  Object.hasOwn(handlers, method) ? handlers[method] : undefined;

interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: RpcError) => void;
}

/**
 * Typed, bidirectional RPC over any {@link Channel}. Construct with
 * {@link RPC.from}.
 *
 * Both type parameters are {@link RpcApi} shapes: `Local` is the API this
 * peer implements (its handlers serve the remote's calls), `Remote` is the
 * API this peer may call. The peer on the other end is the mirror —
 * `RPC<Remote, Local>`.
 *
 * @example
 * ```ts
 * const peer = RPC.from<LocalApi, RemoteApi>(channel, {
 *   requests: { add: ({ left, right }) => left + right },
 *   events: { log: ({ message }) => console.log(message) },
 * });
 *
 * const product = await peer.request('multiply', { left: 6, right: 7 });
 * peer.notify('ping');
 * ```
 */
export class RPC<Local extends RpcApi, Remote extends RpcApi> {
  /**
   * Wrap a channel as an RPC endpoint. `handlers` implements `Local`.
   */
  static from<Local extends RpcApi, Remote extends RpcApi>(
    channel: Channel<RpcMessage, RpcMessage>,
    handlers: Local,
  ): RPC<Local, Remote> {
    return new RPC<Local, Remote>(channel, handlers);
  }

  readonly #channel: Channel<RpcMessage, RpcMessage>;
  readonly #requestHandlers: Record<string, RpcProcedure | undefined>;
  readonly #eventHandlers: Record<string, RpcProcedure | undefined>;
  readonly #pending = new Map<number, PendingRequest>();
  #nextRequestId = 1;

  private constructor(
    channel: Channel<RpcMessage, RpcMessage>,
    handlers: Local,
  ) {
    this.#channel = channel;
    this.#requestHandlers = handlers.requests;
    this.#eventHandlers = handlers.events;
    this.#channel.onMessage((message) => {
      void this.#dispatch(message);
    });
  }

  /**
   * Call a remote request method and await its result. Rejects with an
   * {@link RpcError} if the remote handler throws (or the method is
   * unknown to the remote).
   */
  request<Method extends RequestMethod<Remote>>(
    method: Method,
    ...args: Parameters<Remote['requests'][Method]>
  ): Promise<ResultOf<Remote['requests'][Method]>> {
    const id = this.#nextRequestId++;
    return new Promise<ResultOf<Remote['requests'][Method]>>(
      (resolve, reject) => {
        this.#pending.set(id, {
          resolve: (result) =>
            resolve(result as ResultOf<Remote['requests'][Method]>),
          reject: (error) => reject(error),
        });
        this.#channel.send({ type: 'request', id, method, params: args[0] });
      },
    );
  }

  /** Fire a remote event. Returns once handed to the channel. */
  notify<Method extends EventMethod<Remote>>(
    method: Method,
    ...args: Parameters<Remote['events'][Method]>
  ): void {
    this.#channel.send({ type: 'event', method, params: args[0] });
  }

  async #dispatch(message: RpcMessage): Promise<void> {
    switch (message.type) {
      case 'request':
        await this.#handleRequest(message);
        return;
      case 'event':
        this.#handleEvent(message);
        return;
      case 'response':
        this.#handleResponse(message);
        return;
    }
  }

  async #handleRequest(
    message: RpcMessage & { type: 'request' },
  ): Promise<void> {
    const handler = findHandler(this.#requestHandlers, message.method);
    if (!handler) {
      this.#channel.send({
        type: 'response',
        id: message.id,
        ok: false,
        error: { message: `Unknown request method: ${message.method}` },
      });
      return;
    }

    try {
      const result = await handler(message.params as never);
      this.#channel.send({
        type: 'response',
        id: message.id,
        ok: true,
        result,
      });
    } catch (thrown) {
      const error =
        thrown instanceof Error ? thrown : new Error(String(thrown));

      // An RpcError is a deliberate, expected failure. Anything else is an
      // internal bug in the handler — surface it to observability so it
      // isn't lost behind the wire.
      if (!(error instanceof RpcError)) {
        logger.error('Request handler threw', {
          method: message.method,
          error,
        });
      }

      this.#channel.send({
        type: 'response',
        id: message.id,
        ok: false,
        error: { message: error.message },
      });
    }
  }

  #handleEvent(message: RpcMessage & { type: 'event' }): void {
    // Unknown events are dropped — fire-and-forget has no channel to
    // report back on.
    findHandler(this.#eventHandlers, message.method)?.(message.params as never);
  }

  #handleResponse(message: RpcMessage & { type: 'response' }): void {
    const pending = this.#pending.get(message.id);
    if (!pending) return; // Unknown or already-settled id; ignore.
    this.#pending.delete(message.id);

    if (message.ok) pending.resolve(message.result);
    else pending.reject(new RpcError(message.error.message));
  }
}
