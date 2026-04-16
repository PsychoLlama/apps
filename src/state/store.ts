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
    const handlers = new Map<
      Topic<unknown>,
      TransitionHandler<State, unknown>
    >();

    const on: OnFn<State> = (topic, handler) => {
      if (handlers.has(topic)) {
        throw new Error('Duplicate handler for topic');
      }
      handlers.set(topic, handler as TransitionHandler<State, unknown>);
    };

    transitions(on);

    let _handler: TransitionHandler<State, unknown>;
    let _payload: unknown;
    const updater = produce<State>((draft) => _handler(draft, _payload));

    const [state, setState] = createStore<State>(init());

    const unsub = subscribe(eventBus, handlers.keys(), (topic, payload) => {
      _handler = handlers.get(topic)!;
      _payload = payload;
      setState(updater);
    });

    return [state, unsub];
  };
}
