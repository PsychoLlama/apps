import { createLogger } from '@lib/observability';
import type { Transport, Unsubscribe } from './transport.ts';

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
 * Raised when an {@link RPC} is used after {@link RPC.close} — and the
 * rejection handed to every request still in flight at close time.
 *
 * Deliberately *not* an {@link RpcError}: a close is a local lifecycle
 * event, not a remote failure. Code that retries or logs remote errors must
 * not mistake a closed endpoint for one, so callers distinguish the two by
 * type.
 */
export class RpcClosedError extends Error {
  constructor(message = 'RPC closed.') {
    super(message);
    this.name = 'RpcClosedError';
  }
}

/**
 * A request handler's reply: the `result` returned to the caller, plus
 * optional per-send `Options` for the transport (e.g. transferables to hand
 * back by reference). Build one with {@link respond}. `Options` matches the
 * owning {@link RPC}'s option type.
 *
 * Request handlers always return an `RpcResponse` — even when they carry no
 * options. Requiring the wrapper unconditionally keeps the reply's
 * capabilities explicit at every call site rather than hiding them behind an
 * occasional bare return.
 */
export class RpcResponse<Result, Options = never> {
  readonly result: Result;
  readonly options?: Options;

  constructor(result: Result, options?: Options) {
    this.result = result;
    this.options = options;
  }
}

/** Wrap a request handler's result, with optional transport send options. */
export const respond = <Result, Options = never>(
  result: Result,
  options?: Options,
): RpcResponse<Result, Options> => new RpcResponse(result, options);

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
 * Options are only meaningful with a payload. A procedure with an *optional*
 * parameter is treated as having one — pass it explicitly (even as
 * `undefined`) to also pass options.
 */
type CallArgs<Procedure extends RpcProcedure, Options> =
  Parameters<Procedure> extends []
    ? [params?: undefined, options?: Options]
    : [params: Parameters<Procedure>[0], options?: Options];

/**
 * The handler implementing one request procedure. Mirrors the procedure's
 * parameters, but its return is wrapped in an {@link RpcResponse} (sync or
 * `Promise`) so the reply can carry transport `Options`.
 */
type RequestHandler<Procedure extends RpcProcedure, Options> = (
  ...args: Parameters<Procedure>
) =>
  | RpcResponse<ResultOf<Procedure>, Options>
  | Promise<RpcResponse<ResultOf<Procedure>, Options>>;

/** The handler implementing one event procedure. Fire-and-forget. */
type EventHandler<Procedure extends RpcProcedure> = (
  ...args: Parameters<Procedure>
) => void | Promise<void>;

/**
 * The object passed to the {@link RPC} constructor: one handler per declared
 * procedure of `Local`. Request handlers reply via {@link RpcResponse},
 * carrying the transport's `Options`; event handlers return nothing.
 */
export interface RpcHandlers<Api extends RpcApi, Options = never> {
  requests: {
    [Method in keyof Api['requests']]: RequestHandler<
      Api['requests'][Method],
      Options
    >;
  };
  events: {
    [Method in keyof Api['events']]: EventHandler<Api['events'][Method]>;
  };
}

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
  reject: (error: RpcError | RpcClosedError) => void;
}

/**
 * Typed, bidirectional RPC over any {@link Transport}.
 *
 * `Local` and `Remote` are {@link RpcApi} shapes: `Local` is the API this
 * peer implements (its handlers serve the remote's calls), `Remote` is the
 * API this peer may call. The peer on the other end is the mirror —
 * `RPC<Remote, Local, Options>`.
 *
 * `Options` is the transport's per-send option bag, threaded onto `request`,
 * `notify`, and handler replies. It defaults to `never` (no options) and is
 * fixed by the transport — e.g. `MessagePortTransport` supplies `SendOptions`
 * (transferables), so pair it with `RPC<Local, Remote, SendOptions>`.
 *
 * @example
 * ```ts
 * const peer = new RPC<LocalApi, RemoteApi>(transport, {
 *   requests: { add: ({ left, right }) => respond(left + right) },
 *   events: { log: ({ message }) => console.log(message) },
 * });
 *
 * const product = await peer.request('multiply', { left: 6, right: 7 });
 * peer.notify('ping');
 * ```
 */
export class RPC<Local extends RpcApi, Remote extends RpcApi, Options = never> {
  readonly #transport: Transport<RpcMessage, RpcMessage, Options>;
  readonly #requestHandlers: Record<string, RpcProcedure | undefined>;
  readonly #eventHandlers: Record<string, RpcProcedure | undefined>;
  readonly #pending = new Map<number, PendingRequest>();
  readonly #unsubscribe: Unsubscribe;
  #nextRequestId = 1;
  #closed = false;

  /** Wrap a transport as an RPC endpoint. `handlers` implements `Local`. */
  constructor(
    transport: Transport<RpcMessage, RpcMessage, Options>,
    handlers: RpcHandlers<Local, Options>,
  ) {
    this.#transport = transport;
    // The public boundary (`RpcHandlers<Local>`) carries the precise per-method
    // types; internally the dispatcher treats every handler uniformly and casts
    // params/results at the call site, so a loose record is enough here.
    this.#requestHandlers = handlers.requests as Record<string, RpcProcedure>;
    this.#eventHandlers = handlers.events as Record<string, RpcProcedure>;
    this.#unsubscribe = this.#transport.onMessage((message) => {
      void this.#dispatch(message);
    });
  }

  /**
   * Tear down this endpoint: discard the transport listener and reject every
   * in-flight request with an {@link RpcClosedError}. Idempotent. Afterwards
   * both `request` and `notify` throw — sending on a dead endpoint is a bug,
   * and a silent no-op would mask a leak.
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
   * {@link RpcError} if the remote handler throws (or the method is unknown
   * to the remote). Throws an {@link RpcClosedError} if this endpoint has
   * been closed.
   */
  request<Method extends RequestMethod<Remote>>(
    method: Method,
    ...args: CallArgs<Remote['requests'][Method], Options>
  ): Promise<ResultOf<Remote['requests'][Method]>> {
    if (this.#closed) throw new RpcClosedError();
    const [params, options] = args as [params?: unknown, options?: Options];
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
   * Fire a remote event. Returns once handed to the transport. Throws an
   * {@link RpcClosedError} if this endpoint has been closed.
   */
  notify<Method extends EventMethod<Remote>>(
    method: Method,
    ...args: CallArgs<Remote['events'][Method], Options>
  ): void {
    if (this.#closed) throw new RpcClosedError();
    const [params, options] = args as [params?: unknown, options?: Options];
    this.#send({ type: 'event', method, params }, options);
  }

  // Hand a message to the transport, forwarding any send options. The
  // transport decides what to do with them — the type system already
  // guarantees the caller can only pass options this transport understands.
  #send(message: RpcMessage, options?: Options): void {
    this.#transport.send(message, options);
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
    logger.debug('Inbound request', { method: message.method, id: message.id });
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
      const response = (await handler(message.params as never)) as RpcResponse<
        unknown,
        Options
      >;
      this.#send(
        {
          type: 'response',
          id: message.id,
          ok: true,
          result: response.result,
        },
        response.options,
      );
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
    logger.debug('Inbound event', { method: message.method });
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
