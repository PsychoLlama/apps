/**
 * Tests for `watchAll` — the bridge from callback subscriptions to one
 * buffered async stream. Nothing here touches real options; `register`
 * is handed stub unsubscribes so the buffering and teardown are what's
 * under test.
 */

import { watchAll } from '../watch';

interface Change {
  id: string;
}

const setup = (signal?: AbortSignal) => {
  const controller = new AbortController();
  const unsubscribes = [vi.fn(), vi.fn()];
  let push: (change: Change) => void = () => undefined;

  const changes = watchAll<Change>(signal ?? controller.signal, (emit) => {
    push = emit;
    return unsubscribes;
  });

  return {
    changes,
    controller,
    unsubscribes,
    push: (id: string) => push({ id }),
  };
};

describe('watchAll', () => {
  it('registers the subscriptions up front, before anything drains it', () => {
    const { unsubscribes } = setup();

    for (const unsubscribe of unsubscribes) {
      expect(unsubscribe).not.toHaveBeenCalled();
    }
  });

  it('replays changes buffered before the first drain', async () => {
    const { changes, push } = setup();
    push('a');
    push('b');

    const seen: Change[] = [];
    for await (const change of changes) {
      seen.push(change);
      if (seen.length === 2) break;
    }

    expect(seen).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('buffers a burst rather than collapsing it to the last change', async () => {
    const { changes, push } = setup();
    const seen: Change[] = [];

    // Drain concurrently so the consumer is parked on an empty queue when
    // the burst lands — the case where dropping instead of buffering
    // would lose everything but the final change.
    const draining = (async () => {
      for await (const change of changes) {
        seen.push(change);
        if (seen.length === 3) break;
      }
    })();

    push('a');
    push('b');
    push('c');
    await draining;

    expect(seen).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  });

  it('ends and unsubscribes when the signal aborts', async () => {
    const { changes, controller, unsubscribes } = setup();
    const seen: Change[] = [];

    const draining = (async () => {
      for await (const change of changes) seen.push(change);
    })();

    controller.abort();
    await draining;

    expect(seen).toEqual([]);
    for (const unsubscribe of unsubscribes) {
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    }
  });

  it('unsubscribes when the consumer stops draining early', async () => {
    const { changes, push, unsubscribes } = setup();
    push('a');

    for await (const change of changes) {
      expect(change).toEqual({ id: 'a' });
      break;
    }

    for (const unsubscribe of unsubscribes) {
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    }
  });

  it('unsubscribes immediately when handed an already-aborted signal', () => {
    const controller = new AbortController();
    controller.abort();

    const { unsubscribes } = setup(controller.signal);

    // Nothing will ever drain this stream, so teardown can't wait for a
    // consumer to notice.
    for (const unsubscribe of unsubscribes) {
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    }
  });
});
