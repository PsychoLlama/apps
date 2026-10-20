import { batch, untrack } from 'solid-js';
import { assert } from '@lib/assert';
import {
  pipe,
  resource,
  type Mode,
  type Plan,
  type Resource,
} from '@lib/effects';

declare const TOPIC: unique symbol;

/**
 * Emits an event to every commit subscribed to its topic. The function's
 * identity is the topic.
 */
export interface Publish<Args extends readonly unknown[]> {
  (...args: Args): void;

  // Phantom. Keeps arbitrary functions from passing as topics.
  readonly [TOPIC]: Args;
}

/** A plan yielding a publisher: a topic, or a command. */
export type Topic<
  Args extends readonly unknown[],
  M extends Mode = Mode,
> = Plan<[], [Publish<Args>], M>;

/** The arguments a topic's events carry, e.g. `TopicValues<typeof $send>`. */
export type TopicValues<P> =
  P extends Plan<never, readonly [Publish<infer Args>]> ? Args : never;

type Subscriber = (...args: readonly unknown[]) => void;

// The bus. Each live topic owns its subscribers, keyed by its publisher.
const channels = new WeakMap<object, Set<Subscriber>>();

/**
 * Define a topic. Holding the plan binds it to the message bus;
 * extensions subscribe to it with `defineExtension`.
 */
export const defineTopic = <Args extends readonly unknown[]>(): Topic<
  Args,
  'sync'
> =>
  pipe([
    () => {
      const subscribers = new Set<Subscriber>();

      // One batch per event, so every commit it triggers lands together.
      // Untracked, so what subscribers read never leaks into an emitter's
      // reactive scope.
      const publish = (...args: Args) =>
        batch(() =>
          untrack(() => subscribers.forEach((notify) => notify(...args))),
        );

      channels.set(publish, subscribers);
      return publish as Publish<Args>;
    },
  ]);

/**
 * A task subscribing `commit` to the publisher upstream, for as long as
 * the task lives. `commit` takes whatever else upstream yields, once, and
 * returns the event handler, e.g.
 * `pipe([concurrent([$topic, $store]), subscribe(commit)])`.
 *
 * @internal
 */
export const subscribe =
  <Args extends readonly unknown[], Rest extends readonly unknown[]>(
    commit: (...rest: Rest) => (...args: Args) => void,
  ) =>
  (publish: Publish<Args>, ...rest: Rest): Resource<void, 'sync'> => {
    const subscribers = channels.get(publish);
    assert(subscribers, 'Not a topic publisher.');

    // Only ever called with this publisher's arguments.
    const notify = commit(...rest) as Subscriber;
    subscribers.add(notify);

    return resource(undefined, () => {
      subscribers.delete(notify);
    });
  };
