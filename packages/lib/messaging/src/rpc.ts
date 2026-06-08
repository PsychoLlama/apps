import type { Channel } from './channel.ts';

/**
 * A single RPC procedure: takes exactly one `params` argument and returns
 * a result. Requests return a value (sync or `Promise`); events return
 * `void`. The `never` param is a constraint trick — every concrete
 * procedure signature is assignable to it.
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
 * an endpoint exposes none). Every procedure must take exactly one
 * argument — enforced by {@link RPC.from}.
 */
export interface RpcApi {
  requests: Record<string, RpcProcedure>;
  events: Record<string, RpcProcedure>;
}

/** Built-in {@link RpcError.type} values for failures raised by the layer itself. */
export const RpcErrorType = {
  /** The remote has no handler for the requested method. */
  UnknownMethod: 'unknown-method',
  /** A request handler threw a value that wasn't an {@link RpcError}. */
  Internal: 'internal-error',
} as const;

/**
 * Error raised on the caller side when a remote request fails. `type` is a
 * discriminant callers can branch on; a handler throws its own `RpcError`
 * to send a typed failure, otherwise it surfaces as
 * {@link RpcErrorType.Internal}.
 */
export class RpcError extends Error {
  readonly type: string;

  constructor(type: string, message: string) {
    super(message);
    this.name = 'RpcError';
    this.type = type;
  }
}

/**
 * Wire discriminants. Numeric to keep the envelope small — the underlying
 * channel copies these on every message.
 */
const Kind = {
  Request: 0,
  Response: 1,
  Event: 2,
} as const;

/**
 * The wire envelope carried by the underlying {@link Channel}. An `RPC`
 * owns its channel end-to-end, so the channel is always typed
 * `Channel<RpcMessage, RpcMessage>` — these are the only messages on it.
 *
 * `id` correlates a response back to its request. Events carry no `id`
 * because nothing awaits them.
 */
export type RpcMessage =
  | { type: typeof Kind.Request; id: number; method: string; params: unknown }
  | { type: typeof Kind.Response; id: number; ok: true; result: unknown }
  | {
      type: typeof Kind.Response;
      id: number;
      ok: false;
      error: { type: string; message: string };
    }
  | { type: typeof Kind.Event; method: string; params: unknown };

type ParamsOf<Procedure extends RpcProcedure> = Parameters<Procedure>[0];
type ResultOf<Procedure extends RpcProcedure> = Awaited<ReturnType<Procedure>>;

type RequestMethod<Api extends RpcApi> = keyof Api['requests'] & string;
type EventMethod<Api extends RpcApi> = keyof Api['events'] & string;

/**
 * Maps each procedure to itself when it takes exactly one argument, else
 * to `never`. Applied to a handler map so a zero- or multi-argument
 * procedure fails to type-check at {@link RPC.from}.
 */
type SingleArgument<Procedure> = Procedure extends RpcProcedure
  ? Parameters<Procedure> extends [unknown]
    ? Procedure
    : never
  : never;

type EnforceArity<Api extends RpcApi> = {
  requests: {
    [Method in keyof Api['requests']]: SingleArgument<Api['requests'][Method]>;
  };
  events: {
    [Method in keyof Api['events']]: SingleArgument<Api['events'][Method]>;
  };
};

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
 * peer.notify('ping', { at: 0 });
 * ```
 */
export class RPC<Local extends RpcApi, Remote extends RpcApi> {
  /**
   * Wrap a channel as an RPC endpoint. `handlers` implements `Local`;
   * every procedure must take exactly one argument.
   */
  static from<Local extends RpcApi, Remote extends RpcApi>(
    channel: Channel<RpcMessage, RpcMessage>,
    handlers: Local & EnforceArity<Local>,
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
    params: ParamsOf<Remote['requests'][Method]>,
  ): Promise<ResultOf<Remote['requests'][Method]>> {
    const id = this.#nextRequestId++;
    return new Promise<ResultOf<Remote['requests'][Method]>>(
      (resolve, reject) => {
        this.#pending.set(id, {
          resolve: (result) =>
            resolve(result as ResultOf<Remote['requests'][Method]>),
          reject: (error) => reject(error),
        });
        this.#channel.send({ type: Kind.Request, id, method, params });
      },
    );
  }

  /** Fire a remote event. Returns once handed to the channel. */
  notify<Method extends EventMethod<Remote>>(
    method: Method,
    params: ParamsOf<Remote['events'][Method]>,
  ): void {
    this.#channel.send({ type: Kind.Event, method, params });
  }

  async #dispatch(message: RpcMessage): Promise<void> {
    switch (message.type) {
      case Kind.Request:
        await this.#handleRequest(message);
        return;
      case Kind.Event:
        this.#handleEvent(message);
        return;
      case Kind.Response:
        this.#handleResponse(message);
        return;
    }
  }

  async #handleRequest(
    message: RpcMessage & { type: typeof Kind.Request },
  ): Promise<void> {
    const handler = this.#requestHandlers[message.method];
    if (!handler) {
      this.#channel.send({
        type: Kind.Response,
        id: message.id,
        ok: false,
        error: {
          type: RpcErrorType.UnknownMethod,
          message: `Unknown request method: ${message.method}`,
        },
      });
      return;
    }

    try {
      const result = await handler(message.params as never);
      this.#channel.send({
        type: Kind.Response,
        id: message.id,
        ok: true,
        result,
      });
    } catch (error) {
      this.#channel.send({
        type: Kind.Response,
        id: message.id,
        ok: false,
        error:
          error instanceof RpcError
            ? { type: error.type, message: error.message }
            : {
                type: RpcErrorType.Internal,
                message: error instanceof Error ? error.message : String(error),
              },
      });
    }
  }

  #handleEvent(message: RpcMessage & { type: typeof Kind.Event }): void {
    // Unknown events are dropped — fire-and-forget has no channel to
    // report back on.
    this.#eventHandlers[message.method]?.(message.params as never);
  }

  #handleResponse(message: RpcMessage & { type: typeof Kind.Response }): void {
    const pending = this.#pending.get(message.id);
    if (!pending) return; // Unknown or already-settled id; ignore.
    this.#pending.delete(message.id);

    if (message.ok) pending.resolve(message.result);
    else
      pending.reject(new RpcError(message.error.type, message.error.message));
  }
}
