import type { MessageHandler, Transport, Unsubscribe } from './interface.ts';

/**
 * {@link MessagePortTransport}'s per-send options — the `Options` it supplies
 * as a {@link Transport}. A capability bag so the call signature can grow
 * without breaking; today only `transfer`.
 *
 * `transfer` lists {@link Transferable} objects to hand to the peer by
 * reference instead of by copy; transferred objects are neutered in the
 * sender.
 */
export interface SendOptions {
  transfer?: Transferable[];
}

/**
 * The minimal `MessagePort`-shaped carrier {@link MessagePortTransport}
 * drives. A `MessagePort`, `Worker`, or worker global scope all satisfy it.
 */
export interface MessageEndpoint {
  postMessage(message: unknown, transfer: Transferable[]): void;
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent) => void,
  ): void;
  removeEventListener(
    type: 'message',
    listener: (event: MessageEvent) => void,
  ): void;
}

/**
 * Wraps a `MessagePort`-shaped endpoint as a {@link Transport} whose
 * `Options` are {@link SendOptions}. Supports zero-copy transfer via the
 * endpoint's `postMessage` transfer list — pass `transfer` to
 * {@link MessagePortTransport.send}.
 *
 * `postMessage` is synchronous, so a `send` here settles on the next tick and
 * only ever fails for reasons the call site can see immediately — most often
 * a `DataCloneError` from an unserializable payload. Delivery itself is not
 * acknowledged: a resolved `send` means the endpoint accepted the message,
 * not that the peer processed it.
 *
 * Listens via `addEventListener`, so a `MessagePort` delivers nothing until
 * the caller `start()`s it — starting is the consumer's to time, not this
 * transport's. (`Worker` endpoints deliver without starting.) Disposal is
 * symmetric: it detaches this transport's listeners and leaves the carrier
 * open, since closing it belongs to whoever opened it.
 *
 * @example
 * ```ts
 * const { port1, port2 } = new MessageChannel();
 * await using transport = new MessagePortTransport<Inbound, Outbound>(port1);
 * port1.start(); // begin delivery when ready
 * worker.postMessage({ port: port2 }, [port2]);
 * ```
 */
export class MessagePortTransport<Inbound, Outbound> implements Transport<
  Inbound,
  Outbound,
  SendOptions
> {
  readonly #endpoint: MessageEndpoint;

  // Every listener this transport has attached and not yet detached, so
  // disposal can unwind them as a set. `onMessage`'s own unsubscribe still
  // detaches one at a time; this is the whole-transport counterpart.
  readonly #listeners = new Set<(event: MessageEvent) => void>();

  constructor(endpoint: MessageEndpoint) {
    this.#endpoint = endpoint;
  }

  // `async` rather than a hand-built promise so a synchronous `postMessage`
  // throw (a `DataCloneError`) surfaces as a rejection like any other send
  // failure. Callers get one error channel, not two.
  async send(message: Outbound, options?: SendOptions): Promise<void> {
    this.#endpoint.postMessage(message, options?.transfer ?? []);
  }

  onMessage(handler: MessageHandler<Inbound>): Unsubscribe {
    const listener = (event: MessageEvent): void => {
      handler(event.data as Inbound);
    };
    this.#endpoint.addEventListener('message', listener);
    this.#listeners.add(listener);

    return () => {
      this.#endpoint.removeEventListener('message', listener);
      this.#listeners.delete(listener);
    };
  }

  /**
   * Detach every handler this transport registered. The endpoint itself is
   * left open and usable — this transport never opened it, never started it,
   * and doesn't get to close it. Idempotent.
   */
  async [Symbol.asyncDispose](): Promise<void> {
    for (const listener of this.#listeners) {
      this.#endpoint.removeEventListener('message', listener);
    }
    this.#listeners.clear();
  }
}
