import type { Channel } from './channel.ts';

/**
 * A single RPC procedure: takes one `params` argument and returns a
 * result. Requests return a value (sync or `Promise`); notifications
 * return `void`. The `never` param is a constraint trick — every concrete
 * procedure signature is assignable to it.
 */
export type RpcProcedure = (params: never) => unknown;

/**
 * Describes one endpoint's procedures, split by call style.
 *
 * - `requests` expect a response — the caller awaits a result and a
 *   throwing handler rejects the caller's promise.
 * - `notifications` are fire-and-forget — no response, no result.
 *
 * Use inline object types for each map; both are required (pass `{}` when
 * an endpoint exposes none).
 */
export interface RpcApi {
  requests: Record<string, RpcProcedure>;
  notifications: Record<string, RpcProcedure>;
}

/**
 * The wire envelope carried by the underlying {@link Channel}. An
 * `RpcPeer` owns its channel end-to-end, so the channel is always typed
 * `Channel<RpcMessage, RpcMessage>` — these are the only messages on it.
 *
 * `id` correlates a `response` back to its `request`. Notifications carry
 * no `id` because nothing awaits them.
 */
export type RpcMessage =
  | { type: 'request'; id: number; method: string; params: unknown }
  | { type: 'response'; id: number; ok: true; result: unknown }
  | { type: 'response'; id: number; ok: false; error: { message: string } }
  | { type: 'notify'; method: string; params: unknown };

/** Error thrown on the caller side when a remote request handler fails. */
export class RpcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RpcError';
  }
}

type ParamsOf<Procedure extends RpcProcedure> = Procedure extends (
  params: infer Params,
) => unknown
  ? Params
  : never;

type ResultOf<Procedure extends RpcProcedure> = Procedure extends (
  ...args: never
) => infer Result
  ? Awaited<Result>
  : never;

type RequestMethod<Api extends RpcApi> = keyof Api['requests'] & string;
type NotifyMethod<Api extends RpcApi> = keyof Api['notifications'] & string;

interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

/**
 * Typed, bidirectional RPC over any {@link Channel}.
 *
 * Both type parameters are {@link RpcApi} shapes: `Local` is the API this
 * peer implements (its handlers serve the remote's calls), `Remote` is the
 * API this peer may call. The peer on the other end is the mirror —
 * `RpcPeer<Remote, Local>`.
 *
 * @example
 * ```ts
 * const peer = new RpcPeer<LocalApi, RemoteApi>(channel, {
 *   requests: { add: ({ left, right }) => left + right },
 *   notifications: { log: ({ message }) => console.log(message) },
 * });
 *
 * const sum = await peer.request('multiply', { left: 6, right: 7 });
 * peer.notify('ping', { at: Date.now() });
 * ```
 */
export class RpcPeer<Local extends RpcApi, Remote extends RpcApi> {
  readonly #channel: Channel<RpcMessage, RpcMessage>;
  readonly #requestHandlers: Record<string, RpcProcedure | undefined>;
  readonly #notificationHandlers: Record<string, RpcProcedure | undefined>;
  readonly #pending = new Map<number, PendingRequest>();
  #nextRequestId = 1;

  constructor(channel: Channel<RpcMessage, RpcMessage>, handlers: Local) {
    this.#channel = channel;
    this.#requestHandlers = handlers.requests;
    this.#notificationHandlers = handlers.notifications;
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
          resolve: resolve as (result: unknown) => void,
          reject,
        });
        this.#channel.send({ type: 'request', id, method, params });
      },
    );
  }

  /** Fire a remote notification method. Returns once handed to the channel. */
  notify<Method extends NotifyMethod<Remote>>(
    method: Method,
    params: ParamsOf<Remote['notifications'][Method]>,
  ): void {
    this.#channel.send({ type: 'notify', method, params });
  }

  async #dispatch(message: RpcMessage): Promise<void> {
    switch (message.type) {
      case 'request':
        await this.#handleRequest(message);
        return;
      case 'notify':
        this.#handleNotification(message);
        return;
      case 'response':
        this.#handleResponse(message);
        return;
    }
  }

  async #handleRequest(
    message: RpcMessage & { type: 'request' },
  ): Promise<void> {
    const handler = this.#requestHandlers[message.method];
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
    } catch (error) {
      this.#channel.send({
        type: 'response',
        id: message.id,
        ok: false,
        error: {
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  #handleNotification(message: RpcMessage & { type: 'notify' }): void {
    // Unknown notifications are dropped — fire-and-forget has no channel
    // to report back on.
    this.#notificationHandlers[message.method]?.(message.params as never);
  }

  #handleResponse(message: RpcMessage & { type: 'response' }): void {
    const pending = this.#pending.get(message.id);
    if (!pending) return; // Unknown or already-settled id; ignore.
    this.#pending.delete(message.id);

    if (message.ok) pending.resolve(message.result);
    else pending.reject(new RpcError(message.error.message));
  }
}
