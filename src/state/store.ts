import { createStore, produce } from 'solid-js/store';
import type { Topic } from './topic';
import { type EventBus, GLOBAL_EVENT_BUS, subscribe } from './event-bus';

/** Handler that transitions store state in response to a topic payload. */
type TransitionHandler<State, Payload> = (
  state: State,
  payload: Payload,
) => void;

/** Registers a topic handler during store definition. */
type OnFn<State> = <Payload>(
  topic: Topic<Payload>,
  handler: TransitionHandler<State, Payload>,
) => void;

/**
 * Define a store. Returns a factory that creates isolated instances
 * bound to an event bus.
 */
export function defineStore<State extends object>(
  init: () => State,
  transitions: (on: OnFn<State>) => void,
): (eventBus?: EventBus) => [state: State, dispose: () => void] {
  return (eventBus = GLOBAL_EVENT_BUS) => {
    const [state, setState] = createStore<State>(init());
    const handlers = new Map<
      Topic<unknown>,
      TransitionHandler<unknown, unknown>
    >();

    const on: OnFn<State> = (topic, handler) => {
      if (handlers.has(topic)) {
        throw new Error('Duplicate handler for topic');
      }

      handlers.set(
        topic as Topic<unknown>,
        handler as TransitionHandler<unknown, unknown>,
      );
    };

    transitions(on);

    const unsub = subscribe(eventBus, handlers.keys(), (topic, payload) => {
      const handler = handlers.get(topic)!;
      setState(produce((draft) => handler(draft, payload)));
    });

    let disposed = false;

    function dispose() {
      if (disposed) return;
      disposed = true;
      unsub();
    }

    return [state, dispose];
  };
}
