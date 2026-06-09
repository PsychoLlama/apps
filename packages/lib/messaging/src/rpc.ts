import { createLogger } from '@lib/observability';
import type { Transport, Unsubscribe } from './transport.ts';
import { MessagePortTransport, type SendOptions } from './message-port.ts';

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
 * Rejection reason handed to every in-flight request when its {@link RPC} is
 * closed via {@link RPC.close}. A subtype of {@link RpcError} so existing
 * request-failure handling catches it, while `instanceof RpcClosedError`
 * still distinguishes a local teardown from a remote failure.
 */
export class RpcClosedError extends RpcError {
  constructor(message = 'RPC closed.') {
    super(message);
    this.name = 'RpcClosedError';
  }
}

/**
 * The wire envelope carried by the underlying {@link Transport}. An `RPC`
 * owns its transport end-to-end, so the transport is always typed
 * `Transport<RpcMessage, RpcMessage>` — these are the only messages on it.
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
 * Call-site argument tuple for a procedure. `params` is always positional
 * (index 0), `options` always follows (index 1) — so options stay reachable
 * regardless of arity without runtime ambiguity.
 *
 * A no-parameter procedure takes no payload: omit it (`request('ping')`) or
 * pass `undefined` to reach options (`request('ping', undefined, opts)`).
 * Note transfer is only meaningful with a payload. A procedure with an
 * *optional* parameter is treated as having one — pass it explicitly (even
 * as `undefined`) to also pass options.
 */
type CallArgs<Procedure extends RpcProcedure> =
  Parameters<Procedure> extends []
    ? [params?: undefined, options?: SendOptions]
    : [params: Parameters<Procedure>[0], options?: SendOptions];

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

/** Normalize an unknown thrown value to an `Error`. */
const toError = (thrown: unknown): Error =>
  thrown instanceof Error ? thrown : new Error(String(thrown));

interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: RpcError) => void;
}

/**
 * Typed, bidirectional RPC over any {@link Transport}. Construct with
 * {@link RPC.from}.
 *
 * Both type parameters are {@link RpcApi} shapes: `Local` is the API this
 * peer implements (its handlers serve the remote's calls), `Remote` is the
 * API this peer may call. The peer on the other end is the mirror —
 * `RPC<Remote, Local>`.
 *
 * @example
 * ```ts
 * const peer = RPC.from<LocalApi, RemoteApi>(transport, {
 *   requests: { add: ({ left, right }) => left + right },
 *   events: { log: ({ message }) => console.log(message) },
 * });
 *
 * const product = await peer.request('multiply', { left: 6, right: 7 });
 * peer.notify('ping');
 * ```
 */
export class RPC<Local extends RpcApi, Remote extends RpcApi> {
  readonly #transport: Transport<RpcMessage, RpcMessage>;
  readonly #requestHandlers: Record<string, RpcProcedure | undefined>;
  readonly #eventHandlers: Record<string, RpcProcedure | undefined>;
  readonly #pending = new Map<number, PendingRequest>();
  readonly #unsubscribe: Unsubscribe;
  #nextRequestId = 1;
  #closed = false;

  /** Wrap a transport as an RPC endpoint. `handlers` implements `Local`. */
  constructor(transport: Transport<RpcMessage, RpcMessage>, handlers: Local) {
    this.#transport = transport;
    this.#requestHandlers = handlers.requests;
    this.#eventHandlers = handlers.events;
    this.#unsubscribe = this.#transport.onMessage((message) => {
      void this.#dispatch(message);
    });
  }

  /**
   * Tear down this endpoint: discard the transport listener and reject every
   * in-flight request with an {@link RpcClosedError}. Idempotent. Afterwards
   * `request` rejects and `notify` is a no-op.
   *
   * The transport itself is left untouched — this `RPC` doesn't own its
   * lifecycle. Closing the underlying carrier (e.g. `port.close()`) is the
   * owner's call.
   */
  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.#unsubscribe();
    for (const pending of this.#pending.values()) {
      pending.reject(new RpcClosedError());
    }
    this.#pending.clear();
  }

  /**
   * Call a remote request method and await its result. Rejects with an
   * {@link RpcError} if the remote handler throws (or the method is
   * unknown to the remote), or an {@link RpcClosedError} if this endpoint
   * has been closed.
   */
  request<Method extends RequestMethod<Remote>>(
    method: Method,
    ...args: CallArgs<Remote['requests'][Method]>
  ): Promise<ResultOf<Remote['requests'][Method]>> {
    if (this.#closed) return Promise.reject(new RpcClosedError());
    const [params, options] = args as [params?: unknown, options?: SendOptions];
    const id = this.#nextRequestId++;
    return new Promise<ResultOf<Remote['requests'][Method]>>(
      (resolve, reject) => {
        this.#pending.set(id, {
          resolve: (result) =>
            resolve(result as ResultOf<Remote['requests'][Method]>),
          reject: (error) => reject(error),
        });
        try {
          this.#send({ type: 'request', id, method, params }, options);
        } catch (thrown) {
          // The request never left the building (e.g. transfer on a
          // non-transferable transport, or a `DataCloneError`). Drop its
          // pending entry so the id can't leak or later match a stray
          // response.
          this.#pending.delete(id);
          reject(toError(thrown));
        }
      },
    );
  }

  /**
   * Fire a remote event. Returns once handed to the transport. A no-op once
   * this endpoint has been closed.
   */
  notify<Method extends EventMethod<Remote>>(
    method: Method,
    ...args: CallArgs<Remote['events'][Method]>
  ): void {
    if (this.#closed) return;
    const [params, options] = args as [params?: unknown, options?: SendOptions];
    this.#send({ type: 'event', method, params }, options);
  }

  // Route a message through the transport, applying send options if given.
  // Transfer requires a transport that accepts it; asking for it on one
  // that can't is a misconfiguration, not a silent copy.
  #send(message: RpcMessage, options?: SendOptions): void {
    if (options?.transfer && options.transfer.length > 0) {
      if (!(this.#transport instanceof MessagePortTransport)) {
        throw new Error('This transport does not support transfer.');
      }
      this.#transport.send(message, options);
    } else {
      this.#transport.send(message);
    }
  }

  async #dispatch(message: RpcMessage): Promise<void> {
    switch (message.type) {
      case 'request':
        await this.#handleRequest(message);
        return;
      case 'event':
        await this.#handleEvent(message);
        return;
      case 'response':
        this.#handleResponse(message);
        return;
    }
  }

  async #handleRequest(
    message: RpcMessage & { type: 'request' },
  ): Promise<void> {
    logger.trace('Inbound request', { method: message.method, id: message.id });
    const handler = findHandler(this.#requestHandlers, message.method);
    if (!handler) {
      this.#transport.send({
        type: 'response',
        id: message.id,
        ok: false,
        error: { message: `Unknown request method: ${message.method}` },
      });
      return;
    }

    try {
      const result = await handler(message.params as never);
      this.#transport.send({
        type: 'response',
        id: message.id,
        ok: true,
        result,
      });
    } catch (thrown) {
      const error = toError(thrown);

      // An RpcError is a deliberate, expected failure. Anything else is an
      // internal bug in the handler — surface it to observability so it
      // isn't lost behind the wire.
      if (!(error instanceof RpcError)) {
        logger.error('Request handler threw', {
          method: message.method,
          error,
        });
      }

      this.#transport.send({
        type: 'response',
        id: message.id,
        ok: false,
        error: { message: error.message },
      });
    }
  }

  async #handleEvent(message: RpcMessage & { type: 'event' }): Promise<void> {
    logger.trace('Inbound event', { method: message.method });
    const handler = findHandler(this.#eventHandlers, message.method);
    if (!handler) {
      // Fire-and-forget has no response to report back on, so a missing
      // handler is silent on the wire — warn so it isn't silent everywhere.
      logger.warn('Unhandled event', { method: message.method });
      return;
    }
    try {
      // Events are fire-and-forget — no caller to reject. Await so a sync
      // throw or a rejected promise is contained and logged here instead of
      // escaping as an unhandled rejection.
      await handler(message.params as never);
    } catch (thrown) {
      logger.error('Event handler threw', {
        method: message.method,
        error: toError(thrown),
      });
    }
  }

  #handleResponse(message: RpcMessage & { type: 'response' }): void {
    const pending = this.#pending.get(message.id);
    if (!pending) {
      // No request awaits this id — a duplicate, a late response after the
      // caller gave up, or a misbehaving peer. Surface it.
      logger.warn('Unhandled response', { id: message.id });
      return;
    }
    this.#pending.delete(message.id);

    if (message.ok) pending.resolve(message.result);
    else pending.reject(new RpcError(message.error.message));
  }
}
