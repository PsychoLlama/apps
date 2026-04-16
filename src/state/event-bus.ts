import type { Topic } from './topic';

const listenersKey: unique symbol = Symbol();

type Handler = (topic: Topic<unknown>, payload: unknown) => void;

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

    set.add(handler);
    registered.push(topic);
  }

  return () => {
    for (const topic of registered) {
      const set = listeners.get(topic);
      if (set) {
        set.delete(handler);
        if (set.size === 0) listeners.delete(topic);
      }
    }
  };
}

/** Publish to a void topic (no payload). Returns true if any handler was called. */
export function publish(eventBus: EventBus, topic: Topic<void>): boolean;

/** Publish to a typed topic with a payload. Returns true if any handler was called. */
export function publish<Payload>(
  eventBus: EventBus,
  topic: Topic<Payload>,
  payload: Payload,
): boolean;

export function publish(
  eventBus: EventBus,
  topic: Topic<unknown>,
  payload?: unknown,
): boolean {
  const set = eventBus[listenersKey].get(topic);
  if (!set) return false;
  for (const handler of set) {
    handler(topic, payload);
  }
  return true;
}

/** Global event bus used by stores by default. */
export const GLOBAL_EVENT_BUS: EventBus = createEventBus();
