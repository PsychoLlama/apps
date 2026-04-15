import type { Topic } from './topic';

const listenersKey: unique symbol = Symbol();

type Handler = (payload: unknown) => void;

export interface EventBus {
  readonly [listenersKey]: Map<symbol, Set<Handler>>;
}

/** Create an isolated event bus. */
export function createEventBus(): EventBus {
  return { [listenersKey]: new Map() };
}

/**
 * Subscribe to topics with a single handler. The handler receives
 * the topic that fired alongside the payload.
 */
export function subscribe(
  eventBus: EventBus,
  topics: Iterable<Topic<unknown>>,
  handler: (topic: Topic<unknown>, payload: unknown) => void,
): () => void {
  const listeners = eventBus[listenersKey];
  const registered: { topic: symbol; set: Set<Handler>; wrapped: Handler }[] =
    [];

  for (const topic of topics) {
    let set = listeners.get(topic);
    if (!set) {
      set = new Set();
      listeners.set(topic, set);
    }

    const wrapped: Handler = (payload) => handler(topic, payload);
    set.add(wrapped);
    registered.push({ topic, set, wrapped });
  }

  return () => {
    for (const { topic, set, wrapped } of registered) {
      set.delete(wrapped);
      if (set.size === 0) listeners.delete(topic);
    }
  };
}

/** Publish to a topic, notifying all subscribers on the bus. */
export function publish<Payload>(
  eventBus: EventBus,
  topic: Topic<Payload>,
  ...args: void extends Payload ? [] : [Payload]
): void {
  const set = eventBus[listenersKey].get(topic);
  if (!set) return;
  for (const handler of set) {
    handler(args[0]);
  }
}

/** Global event bus used by stores by default. */
export const GLOBAL_EVENT_BUS: EventBus = createEventBus();
