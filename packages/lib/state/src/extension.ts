import type { Accessor, Signal } from 'solid-js';
import {
  collect,
  type Mode,
  type ModeOfSteps,
  type Plan,
  type Reactive,
  type Resource,
} from '@lib/effects';
import { writable, type Cell } from './cell';
import type { Store } from './store';
import { subscribe, type Topic } from './topic';

/**
 * A plan a commit can write to: a complete plan yielding a store, or a
 * cell through `reactive(...)`.
 */
export type Target = Plan<
  void,
  Store<object> | Reactive<unknown, Mode, Cell<unknown>>
>;

/** How a commit sees each target: stores as drafts, cells as signals. */
type Writables<Targets extends readonly Target[]> = {
  [Index in keyof Targets]: Writable<Targets[Index]>;
};

/**
 * Takes the writable targets once per subscription, and returns what
 * responds to each event's arguments.
 */
export type Commit<
  Args extends readonly unknown[],
  Targets extends readonly Target[],
> = (...writables: Writables<Targets>) => (...args: Args) => void;

type Writable<P> =
  P extends Plan<never, infer Output>
    ? Output extends Reactive<unknown, Mode, Cell<infer T>>
      ? Signal<T>
      : Output extends Store<infer State>
        ? State
        : never
    : never;

/**
 * Attach a commit to a topic defined elsewhere, writing your own stores
 * and cells for each of its events. Reach for it to react to another
 * feature's events, e.g. across a lazy-loading boundary. Holding the plan
 * holds the subscription and its targets. Every commit an event triggers
 * runs in one batch.
 */
export const defineExtension = <
  Args extends readonly unknown[],
  const Targets extends readonly Target[],
  M extends Mode = 'sync',
>(
  topic: Topic<Args, M>,
  targets: Targets,
  // Args come from the topic. A commit that ignores them mustn't narrow it.
  commit: Commit<NoInfer<Args>, Targets>,
): Plan<
  void,
  Resource<void, 'sync'>,
  ModeOfSteps<readonly [Topic<Args, M>, ...Targets]>
> =>
  collect(
    [topic, ...targets],
    subscribe(
      (...yields) => commit(...writables<Targets>(yields)),
      () => {},
    ),
  );

/**
 * How a commit sees what its targets yield. Stores yield their proxy,
 * cells their accessor.
 *
 * @internal
 */
export const writables = <Targets extends readonly Target[]>(
  yields: readonly unknown[],
) =>
  // Position by position, which `map` can't type. Cells are the only
  // targets yielding functions, and `writable` checks the rest.
  yields.map((target) =>
    typeof target === 'function'
      ? writable(target as Accessor<unknown>)
      : target,
  ) as Writables<Targets>;
