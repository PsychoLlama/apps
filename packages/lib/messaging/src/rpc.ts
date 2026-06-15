import type { Transport, Unsubscribe } from './transport/interface.ts';

/**
 * Normalize an unknown thrown value to an `Error`. A `catch` binding is typed
 * `unknown` because anything can be thrown, but the wire envelope and a
 * rejected request both want a real `Error` (for its `.message`). Existing
 * errors pass through untouched; anything else is wrapped, keeping the
 * original value on `cause`.
 *
 * Kept local rather than pulled from `@lib/observability`: messaging is the
 * lower layer, and `@lib/observability`'s worker backend talks over this RPC
 * — depending on it here would close that into a cycle.
 */
const toError = (thrown: unknown): Error =>
  thrown instanceof Error
    ? thrown
    : new Error(String(thrown), { cause: thrown });

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
 * Both sections are optional: omit the one an endpoint doesn't expose
 * rather than spelling out an empty map. A procedure may take zero or one
 * argument, never more.
 */
export interface RpcApi {
  requests?: Record<string, RpcProcedure>;
  events?: Record<string, RpcProcedure>;
}

/**
 * An endpoint's `requests`/`events` map with its optionality stripped, so an
 * omitted section reads as an empty map instead of `undefined`. Indexing and
 * `keyof` then behave uniformly whether or not the {@link RpcApi} declared
 * that section.
 */
type Requests<Api extends RpcApi> = NonNullable<Api['requests']>;
type Events<Api extends RpcApi> = NonNullable<Api['events']>;

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

type RequestMethod<Api extends RpcApi> = keyof Requests<Api> & string;
type EventMethod<Api extends RpcApi> = keyof Events<Api> & string;

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
 * The handler implementing one request procedure. Receives the call's
 * `params` (index 0; `undefined` for a no-argument procedure) and a mutable
 * `options` bag (index 1) carrying the transport's per-send `Options`. Set
 * fields on `options` — e.g. `options.transfer` — to hand capabilities back
 * with the reply. Returns the bare result (sync or `Promise`); no wrapper.
 */
type RequestHandler<Procedure extends RpcProcedure, Options> = (
  params: Parameters<Procedure>[0],
  options: Options,
) => ResultOf<Procedure> | Promise<ResultOf<Procedure>>;

/** The handler implementing one event procedure. Fire-and-forget. */
type EventHandler<Procedure extends RpcProcedure> = (
  ...args: Parameters<Procedure>
) => void | Promise<void>;

/**
 * The object passed to the {@link RPC} constructor: one handler per declared
 * procedure of `Local`. Request handlers return their result and may attach
 * transport `Options` via the mutable bag they receive; event handlers return
 * nothing.
 *
 * Each section is required only when `Local` declares it — omit `requests`
 * (or `events`) entirely when the endpoint exposes none, mirroring the
 * optional sections of {@link RpcApi}.
 */
export type RpcHandlers<Api extends RpcApi, Options = never> = HandlerSection<
  'requests',
  {
    [Method in keyof Requests<Api>]: RequestHandler<
      Requests<Api>[Method],
      Options
    >;
  }
> &
  HandlerSection<
    'events',
    { [Method in keyof Events<Api>]: EventHandler<Events<Api>[Method]> }
  >;

/**
 * One `{ requests: … }` / `{ events: … }` slice of {@link RpcHandlers}. An
 * empty section (the endpoint declares no procedures of that style) becomes
 * an optional key — there's nothing to implement — while a populated one
 * stays required so a declared procedure can't go unhandled.
 */
type HandlerSection<Key extends string, Handlers> = [keyof Handlers] extends [
  never,
]
  ? { [K in Key]?: Handlers }
  : { [K in Key]: Handlers };

/**
 * The handler object {@link defineContract} accepts — the single value from
 * which both the runtime handlers and the API contract are taken. Mirrors
 * {@link RpcApi}, but each request handler may additionally receive the
 * transport's mutable `Options` bag as a 2nd argument; events stay
 * fire-and-forget and params-only.
 *
 * Authors annotate `params`; `options` is typed from the `Options` handed to
 * `defineContract`. A handler may take no more than `(params, options)` — a
 * third argument is rejected, keeping the {@link DerivedApi derived contract}
 * within {@link RpcApi}'s arity-≤1 bound.
 */
interface RpcDefinition<Options> {
  requests?: Record<string, (params: never, options: Options) => unknown>;
  events?: Record<string, (params: never) => void>;
}

/**
 * One handler reduced to its API contract: the procedure with its `options`
 * argument dropped, leaving the params-only shape a peer calls against. Arity
 * is preserved through the params tuple — a handler whose sole payload is the
 * options bag (first param `void`) contracts to a zero-argument procedure.
 */
type ContractOf<Handler> = Handler extends (...args: infer Args) => infer Result
  ? Args extends [infer Params, ...unknown[]]
    ? [Params] extends [void]
      ? () => Result
      : (params: Params) => Result
    : () => Result
  : never;

/**
 * Fix a procedure's result to `void`, preserving its parameters. Events are
 * fire-and-forget — whatever a handler happens to return is discarded — so the
 * derived event contract reads as `void` regardless of the handler's body.
 */
type Voidify<Procedure> = Procedure extends (...args: infer Args) => unknown
  ? (...args: Args) => void
  : never;

/**
 * The {@link RpcApi} derived from an {@link RpcDefinition}: each request reduced
 * to its {@link ContractOf params-only contract}, each event likewise but with
 * its result fixed to `void`. `typeof` the value {@link defineContract} returns
 * resolves to this — the type a peer imports as its `Remote`.
 */
type DerivedApi<Definition> = {
  [Section in keyof Definition & ('requests' | 'events')]: {
    [Method in keyof Definition[Section]]: Section extends 'events'
      ? Voidify<ContractOf<Definition[Section][Method]>>
      : ContractOf<Definition[Section][Method]>;
  };
};

/**
 * Author an endpoint's handlers and derive its API contract from the same
 * value. Returns `handlers` unchanged at runtime; its *type* is the params-only
 * {@link RpcApi} a peer calls against. One definition thus serves as both the
 * implementation passed to {@link RPC.from} and the `typeof`-derived contract
 * shared with the other peer — no separate, dummy params-only value to keep in
 * sync.
 *
 * Curried so the transport's `Options` is given explicitly while the handler
 * shape is inferred: `defineContract<SendOptions>()({ … })`. Within the
 * handlers each request's `options` bag is typed from that argument; set fields
 * on it (e.g. `options.transfer`) to attach send options to the reply. The bag
 * is dropped from the derived contract, so using it never leaks into the API.
 *
 * @example
 * ```ts
 * const api = defineContract<SendOptions>()({
 *   requests: {
 *     status: () => 'online',
 *     mint: (_params: void, options) => {
 *       const buffer = new ArrayBuffer(8);
 *       options.transfer = [buffer]; // rides along with the reply
 *       return buffer;
 *     },
 *   },
 *   events: { ready: (info: { version: string }) => announce(info) },
 * });
 * export type LocalApi = typeof api; // the peer imports this as its Remote
 *
 * const rpc = RPC.from<LocalApi, RemoteApi, SendOptions>(transport, api);
 * ```
 */
export const defineContract =
  <Options = never>() =>
  <const Definition extends RpcDefinition<Options>>(
    handlers: Definition,
  ): DerivedApi<Definition> =>
    // Identity at runtime; the cast re-types the handlers as their derived,
    // params-only contract so `typeof` reads as the API rather than the
    // options-carrying handler shape.
    handlers as unknown as DerivedApi<Definition>;

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
 * `notify`, and the mutable bag each request handler receives. It defaults to
 * `never` (no options) and is fixed by the transport — e.g.
 * `MessagePortTransport` supplies `SendOptions` (transferables), so pair it
 * with `RPC<Local, Remote, SendOptions>`.
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
export class RPC<Local extends RpcApi, Remote extends RpcApi, Options = never> {
  readonly #transport: Transport<RpcMessage, RpcMessage, Options>;
  readonly #requestHandlers: Record<string, RpcProcedure | undefined>;
  readonly #eventHandlers: Record<string, RpcProcedure | undefined>;
  readonly #pending = new Map<number, PendingRequest>();
  readonly #unsubscribe: Unsubscribe;
  #nextRequestId = 1;
  #closed = false;

  /**
   * Wrap a transport as an RPC endpoint. `handlers` implements `Local`.
   *
   * Named (rather than a bare `new`) because construction isn't inert: it
   * eagerly subscribes to the transport. The factory makes that side effect
   * read as an action at the call site instead of a plain allocation.
   */
  static from<Local extends RpcApi, Remote extends RpcApi, Options = never>(
    transport: Transport<RpcMessage, RpcMessage, Options>,
    handlers: RpcHandlers<Local, Options>,
  ): RPC<Local, Remote, Options> {
    return new RPC<Local, Remote, Options>(transport, handlers);
  }

  // Private: build through `RPC.from`. Construction subscribes to the
  // transport (a side effect), and the named factory surfaces that at the
  // call site where a `new` would read as inert.
  private constructor(
    transport: Transport<RpcMessage, RpcMessage, Options>,
    handlers: RpcHandlers<Local, Options>,
  ) {
    this.#transport = transport;
    // The public boundary (`RpcHandlers<Local>`) carries the precise per-method
    // types; internally the dispatcher treats every handler uniformly and casts
    // params/results at the call site, so a loose record is enough here. Either
    // section may be omitted (the API declares none) — default to empty.
    this.#requestHandlers =
      (handlers.requests as Record<string, RpcProcedure> | undefined) ?? {};
    this.#eventHandlers =
      (handlers.events as Record<string, RpcProcedure> | undefined) ?? {};
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
    ...args: CallArgs<Requests<Remote>[Method], Options>
  ): Promise<ResultOf<Requests<Remote>[Method]>> {
    if (this.#closed) throw new RpcClosedError();
    const [params, options] = args as [params?: unknown, options?: Options];
    const id = this.#nextRequestId++;
    return new Promise<ResultOf<Requests<Remote>[Method]>>(
      (resolve, reject) => {
        this.#pending.set(id, {
          resolve: (result) =>
            resolve(result as ResultOf<Requests<Remote>[Method]>),
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
    ...args: CallArgs<Events<Remote>[Method], Options>
  ): void {
    if (this.#closed) throw new RpcClosedError();
    const [params, options] = args as [params?: unknown, options?: Options];
    this.#send({ type: 'event', method, params }, options);
  }

  // Hand a message to the transport, materializing an empty options bag when
  // the caller has none. The transport always receives a bag and decides what
  // to do with it — the type system already guarantees the caller can only
  // pass options this transport understands.
  #send(message: RpcMessage, options?: Options): void {
    this.#transport.send(message, options ?? ({} as Options));
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
    const handler = findHandler(this.#requestHandlers, message.method);
    if (!handler) {
      this.#send({
        type: 'response',
        id: message.id,
        ok: false,
        error: { message: `Unknown request method: ${message.method}` },
      });
      return;
    }

    try {
      // Hand the handler a fresh, mutable options bag. It may set fields on it
      // (e.g. `options.transfer`) to attach transport send options to the
      // reply; whatever it leaves there rides along with the response.
      const options = {} as Options;
      const reply = handler as (params: never, options: Options) => unknown;
      const result = await reply(message.params as never, options);
      this.#send(
        {
          type: 'response',
          id: message.id,
          ok: true,
          result,
        },
        options,
      );
    } catch (thrown) {
      // The handler failed — whether deliberately (an RpcError) or from an
      // internal bug. Either way the caller's `request` promise rejects with
      // the message below, so the failure surfaces on their end.
      const error = toError(thrown);
      this.#send({
        type: 'response',
        id: message.id,
        ok: false,
        error: { message: error.message },
      });
    }
  }

  async #handleEvent(message: RpcMessage & { type: 'event' }): Promise<void> {
    const handler = findHandler(this.#eventHandlers, message.method);
    // Fire-and-forget has no response to report back on, so an unknown event
    // is simply ignored.
    if (!handler) return;
    try {
      // Events are fire-and-forget — no caller to reject. Await so a sync
      // throw or a rejected promise is contained here rather than escaping as
      // an unhandled rejection; with no caller to surface it to, a failing
      // handler is otherwise on its own to report.
      await handler(message.params as never);
    } catch {
      // Swallowed: nothing waits on an event, so there's nowhere to route the
      // error.
    }
  }

  #handleResponse(message: RpcMessage & { type: 'response' }): void {
    const pending = this.#pending.get(message.id);
    if (!pending) {
      // No request awaits this id — a duplicate, a late response after the
      // caller gave up, or a misbehaving peer. Nothing to resolve, so drop it.
      return;
    }
    this.#pending.delete(message.id);

    if (message.ok) pending.resolve(message.result);
    else pending.reject(new RpcError(message.error.message));
  }
}
