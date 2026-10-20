import type { Accessor, Signal } from 'solid-js';
import {
  concurrent,
  pipe,
  type Mode,
  type Plan,
  type Resource,
} from '@lib/effects';
import { writable, type Cell } from './cell';
import type { Store } from './store';
import { subscribe, type Publish, type Topic } from './topic';

/** A plan a commit can write to: a complete store or cell plan. */
export type Target = Plan<[], readonly [Store<object> | Cell<unknown>]>;

/** How a commit sees each target: stores as drafts, cells as signals. */
export type Writables<Targets extends readonly Target[]> = {
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

// TODO: Move into `@lib/effects`. It's useful well beyond extensions.
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
  [],
  [Resource<void, 'sync'>],
  ModeOfPlans<[Topic<Args, M>, ...Targets]>
> =>
  // Generic steps defeat `pipe` inference. The signature vouches.
  pipe([
    concurrent([topic, ...targets] as [Branch, ...Branch[]]) as unknown as Plan<
      [],
      [Publish<Args>, ...unknown[]]
    >,
    subscribe((...yields: unknown[]) =>
      commit(...(yields.map(toWritable) as Writables<Targets>)),
    ),
  ]) as unknown as Plan<
    [],
    [Resource<void, 'sync'>],
    ModeOfPlans<[Topic<Args, M>, ...Targets]>
  >;

type Branch = Plan<[], readonly unknown[]>;

// Stores yield their proxy, cells their accessor.
const toWritable = (target: unknown) =>
  typeof target === 'function' ? writable(target as Accessor<unknown>) : target;
