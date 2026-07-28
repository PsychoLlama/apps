/**
 * Merge several {@link subscribe} registrations into one buffered async
 * stream — the shape a saga can drain with `for await`.
 *
 * `register` wires up whatever subscriptions the caller wants, calling
 * `push` with its own change shape, and returns their unsubscribes.
 *
 * Subscribing happens here, before the stream is drained, and buffers
 * from that moment. A caller can open the stream, do slower work, and
 * drain afterwards without losing anything that landed in between —
 * which is how a hydrating consumer avoids overwriting a change that
 * beat it.
 *
 * Buffering rather than dropping also keeps a burst of writes — a reset
 * touching several options, say — from collapsing into whichever one the
 * consumer happened to be awake for.
 *
 * Unsubscribes when `signal` aborts or when draining ends, whichever
 * comes first. An abandoned stream is safe: the abort alone cleans up.
 */
export const watchAll = <Change>(
  signal: AbortSignal,
  register: (push: (change: Change) => void) => ReadonlyArray<() => void>,
): AsyncGenerator<Change> => {
  const pending: Change[] = [];

  // Resolved when a change lands or the signal aborts, whichever wakes
  // the parked consumer first.
  let wake: (() => void) | null = null;
  const push = (change: Change): void => {
    pending.push(change);
    wake?.();
  };

  const unsubscribes = register(push);

  let stopped = false;
  const stop = (): void => {
    if (stopped) return;
    stopped = true;
    for (const unsubscribe of unsubscribes) unsubscribe();
  };

  // An already-aborted signal never fires the event, so the subscriptions
  // registered a moment ago would leak if nothing ever drained them.
  if (signal.aborted) {
    stop();
  } else {
    signal.addEventListener(
      'abort',
      () => {
        stop();
        wake?.();
      },
      { once: true },
    );
  }

  const drain = async function* (): AsyncGenerator<Change> {
    try {
      while (!signal.aborted) {
        // The length check is what rules out `shift()`'s `undefined`;
        // narrowing can't see through it.
        if (pending.length > 0) {
          yield pending.shift() as Change;
          continue;
        }

        await new Promise<void>((resolve) => {
          wake = resolve;
        });
        wake = null;
      }
    } finally {
      stop();
    }
  };

  return drain();
};
