import type { Mode, Plan } from '@lib/effects';
import type { Signal } from 'solid-js';
import type { Cell } from './cell';
import type { Store } from './store';
import type { Topic } from './topic';
import { unimplemented } from './unimplemented';

/** A plan a change can write to: a complete store or cell plan. */
export type Target = Plan<[], readonly [Store<object> | Cell<unknown>]>;

/** How a change sees each target: stores as drafts, cells as signals. */
export type Writables<Targets extends readonly Target[]> = {
  [Index in keyof Targets]: Writable<Targets[Index]>;
};

/**
 * Responds to one event: takes the event's arguments, then the writable
 * targets.
 */
export type Commit<
  Args extends readonly unknown[],
  Targets extends readonly Target[],
> = (...args: Args) => (...writables: Writables<Targets>) => void;

// TODO: Move into `@lib/effects`. It's useful well beyond changes.
/** The combined mode of several plans: `async` if any of them is. */
export type ModeOfPlans<Plans extends readonly unknown[]> = 'async' extends {
  [Index in keyof Plans]: Plans[Index] extends Plan<
    never,
    readonly unknown[],
    infer M
  >
    ? M
    : never;
}[number]
  ? 'async'
  : 'sync';

// Cells first: a cell is an object, so it would otherwise read as a store.
type Writable<P> =
  P extends Plan<never, readonly [Cell<infer T>]>
    ? Signal<T>
    : P extends Plan<never, readonly [Store<infer State>]>
      ? State
      : never;

/**
 * Subscribe to a topic, writing to stores and cells for each event.
 * Holding the plan holds the subscription and its targets. Every
 * change an event triggers runs in one batch.
 */
export const defineChange = <
  Args extends readonly unknown[],
  const Targets extends readonly Target[],
  M extends Mode = 'sync',
>(
  topic: Topic<Args, M>,
  targets: Targets,
  commit: Commit<Args, Targets>,
): Plan<[], [void], ModeOfPlans<[Topic<Args, M>, ...Targets]>> =>
  unimplemented(topic, targets, commit);
