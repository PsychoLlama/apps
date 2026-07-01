import type { MessageHandler, Transport, Unsubscribe } from './interface.ts';

/** Configuration for a {@link BroadcastChannelTransport}. */
export interface BroadcastChannelConfig {
  /** Name of the same-origin {@link BroadcastChannel} to open. */
  channel: string;

  /**
   * Echo each {@link BroadcastChannelTransport.send} back to this instance's own
   * handlers. A `BroadcastChannel` withholds every post from the instance that
   * sent it — delivering only to siblings — so with this off a lone transport
   * never hears itself, and a publisher and subscriber in one context must each
   * hold their own instance. Turn it on and a single transport both publishes
   * and observes its own writes, no sibling required. Required so every call
   * site states which role it wants.
   */
  selfDeliver: boolean;
}

/**
 * Wraps a {@link BroadcastChannel} as a {@link Transport} for fan-out,
 * same-origin events across browsing contexts (tabs, workers) on one named
 * channel. A broadcast is untyped by direction — every context sees the same
 * feed — so a single `Message` type rides both ways. No per-send options and no
 * responses either: it's a pure pub/sub carrier, so pair it with the
 * transport's `send`/`onMessage` directly rather than RPC, whose
 * request/response model a broadcast can't fulfill.
 *
 * Owns its channel: construct it with a {@link BroadcastChannelConfig} and
 * {@link close} when done (or bind it with `using` for automatic teardown). By
 * default a `BroadcastChannel` never delivers a message back to the instance
 * that posted it, only to sibling instances — so a publisher and a subscriber
 * in one context each need their own transport to hear each other. Set
 * {@link BroadcastChannelConfig.selfDeliver} to fold both roles into one
 * instance: `send` then also replays to this transport's own handlers.
 *
 * @example
 * ```ts
 * using transport = new BroadcastChannelTransport<Message>({
 *   channel: 'log-files',
 *   selfDeliver: false,
 * });
 * transport.onMessage((message) => {});
 * transport.send(payload);
 * ```
 */
export class BroadcastChannelTransport<Message>
  implements Transport<Message, Message>, Disposable
{
  readonly #channel: BroadcastChannel;
  readonly #selfDeliver: boolean;

  // The self-emit fan-out, populated only while `selfDeliver` is on: one entry
  // per live handler, invoked directly on a local `send`. The remote path needs
  // no such registry — it rides the channel's own listeners, and closing the
  // channel stops delivery, so there's nothing to detach there.
  readonly #localHandlers = new Set<(message: Message) => void>();

  constructor(config: BroadcastChannelConfig) {
    this.#channel = new BroadcastChannel(config.channel);
    this.#selfDeliver = config.selfDeliver;
  }

  send(message: Message): void {
    this.#channel.postMessage(message);

    // A channel never echoes a sender its own post, so `selfDeliver` replays it
    // to local handlers by hand. It fires synchronously here, ahead of the async
    // sibling delivery.
    if (this.#selfDeliver) {
      for (const emit of this.#localHandlers) {
        emit(message);
      }
    }
  }

  onMessage(handler: MessageHandler<Message>): Unsubscribe {
    const listener = (event: MessageEvent): void => {
      handler(event.data as Message);
    };
    this.#channel.addEventListener('message', listener);

    // A distinct closure per registration so duplicate handlers each unsubscribe
    // independently, mirroring the remote path's per-listener detach.
    const emit = (message: Message): void => handler(message);
    if (this.#selfDeliver) this.#localHandlers.add(emit);

    return () => {
      this.#channel.removeEventListener('message', listener);
      this.#localHandlers.delete(emit);
    };
  }

  /**
   * Close the underlying channel and drop the self-emit handlers. A closed
   * `BroadcastChannel` receives no further posts, so the remote path needs no
   * per-handler detach — the dead channel and its listeners are collected
   * together — while clearing the local set ends the self-emit path.
   */
  close(): void {
    this.#channel.close();
    this.#localHandlers.clear();
  }

  /** Tear down on scope exit, so a `using` binding can't leak the channel. */
  [Symbol.dispose](): void {
    this.close();
  }
}
