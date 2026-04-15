import { type EventBus, GLOBAL_EVENT_BUS, publish } from './event-bus';

declare const PHANTOM_FIELD: unique symbol;

/** A typed topic identity. Branded symbol carrying a phantom payload type. */
export type Topic<Payload = void> = symbol & {
  readonly [PHANTOM_FIELD]: Payload;
};

/** Create a typed topic. Returns a `Symbol()` with phantom type branding. */
export function defineTopic<Payload = void>(): Topic<Payload> {
  return Symbol() as Topic<Payload>;
}

/** Bind a void topic to an event bus, returning a callable publish function. */
export function useTopic(topic: Topic<void>, eventBus?: EventBus): () => void;

/** Bind a typed topic to an event bus, returning a callable publish function. */
export function useTopic<Payload>(
  topic: Topic<Payload>,
  eventBus?: EventBus,
): (payload: Payload) => void;

export function useTopic<Payload>(
  topic: Topic<Payload>,
  eventBus: EventBus = GLOBAL_EVENT_BUS,
): (payload: Payload) => void {
  return (payload: Payload) => publish(eventBus, topic, payload);
}
