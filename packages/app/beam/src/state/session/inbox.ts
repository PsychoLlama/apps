/**
 * A one-way queue bridging push to pull. iroh hands us inbound peers and
 * inbound messages through callbacks; a saga consumes them by awaiting one
 * at a time. Nothing in `@lib/state` spans that gap — `call` runs a
 * capability and takes its answer — so the capability layer parks arrivals
 * here and the saga loops on {@link Inbox.next}.
 *
 * Unbounded on purpose: the producer is a wasm callback that can't be told
 * to wait, and everything queued here is a short control frame. What keeps
 * it from growing is the consumer, which is a saga loop that only stops when
 * the scope dies — taking the inbox with it.
 */

/** A queue of arrivals, filled by a callback and drained by a saga. */
export interface Inbox<T> {
  /** Park an arrival, handing it straight to a waiting reader if there is one. */
  push: (item: T) => void;

  /**
   * The next arrival, resolving immediately if one is already queued.
   * Rejects with the signal's reason if the wait is abandoned, so a saga
   * looping on this unwinds when its scope is released.
   */
  next: (signal: AbortSignal) => Promise<T>;
}

/** An empty inbox. */
export const createInbox = <T>(): Inbox<T> => {
  const queued: T[] = [];
  const readers: Array<(item: T) => void> = [];

  return {
    push: (item) => {
      const deliver = readers.shift();
      if (deliver) deliver(item);
      else queued.push(item);
    },

    next: (signal) =>
      new Promise<T>((resolve, reject) => {
        if (signal.aborted) {
          reject(signal.reason as Error);
          return;
        }

        if (queued.length > 0) {
          resolve(queued.shift() as T);
          return;
        }

        const deliver = (item: T) => {
          signal.removeEventListener('abort', abandon);
          resolve(item);
        };

        // Drop the reader on the way out. Without this a released scope
        // leaves a resolver in the queue that would swallow the next
        // arrival on behalf of a saga that is no longer running.
        const abandon = () => {
          const index = readers.indexOf(deliver);
          if (index >= 0) readers.splice(index, 1);
          reject(signal.reason as Error);
        };

        signal.addEventListener('abort', abandon, { once: true });
        readers.push(deliver);
      }),
  };
};
