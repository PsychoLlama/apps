import type { Topic } from './topic';

const listenersKey: unique symbol = Symbol();

type Handler = (topic: symbol, payload: unknown) => void;

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
  const registered: symbol[] = [];

  for (const topic of topics) {
    let set = listeners.get(topic);
    if (!set) {
      set = new Set();
      listeners.set(topic, set);
    }

    set.add(handler as Handler);
    registered.push(topic);
  }

  return () => {
    for (const topic of registered) {
      const set = listeners.get(topic);
      if (set) {
        set.delete(handler as Handler);
        if (set.size === 0) listeners.delete(topic);
      }
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
    handler(topic, args[0]);
  }
}

/** Global event bus used by stores by default. */
export const GLOBAL_EVENT_BUS: EventBus = createEventBus();
