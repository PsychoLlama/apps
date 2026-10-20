import type { Mode, Plan } from '@lib/effects';
import { unimplemented } from './unimplemented';

declare const TOPIC: unique symbol;

/**
 * Emits an event to every change subscribed to its topic. The function's
 * identity is the topic.
 */
export interface Publish<Args extends readonly unknown[]> {
  (...args: Args): void;

  // Phantom. Keeps arbitrary functions from passing as topics.
  readonly [TOPIC]: Args;
}

/** A plan yielding a publisher: a topic, or an action. */
export type Topic<
  Args extends readonly unknown[],
  M extends Mode = Mode,
> = Plan<[], [Publish<Args>], M>;

/** The arguments a topic's events carry, e.g. `TopicValues<typeof $send>`. */
export type TopicValues<P> =
  P extends Plan<never, readonly [Publish<infer Args>]> ? Args : never;

/**
 * Define a topic. Holding the plan binds it to the message bus; changes
 * subscribe to it with `defineChange`.
 */
export const defineTopic = <Args extends readonly unknown[]>(): Topic<
  Args,
  'sync'
> => unimplemented();
