import {
  createSignal,
  type Accessor,
  type Setter,
  type Signal,
} from 'solid-js';
import { assert } from '@lib/assert';
import { pipe, reactive, type Plan, type Reactive } from '@lib/effects';

declare const CELL: unique symbol;

/**
 * A cell's accessor: a reactive value, for state that isn't an object.
 * Read it like any signal; write it from `defineCommand` or
 * `defineExtension`.
 */
export type Cell<T> = Accessor<T> & {
  // Phantom. Keeps arbitrary accessors from passing as cells.
  readonly [CELL]: T;
};

// Each live cell's signal, keyed by the accessor readers get. Only commits
// recover the setter.
const signals = new WeakMap<Accessor<unknown>, Signal<unknown>>();

/**
 * Create a cell in a plan step that owns its state, e.g. one that also
 * hydrates or watches it. Return the accessor through `reactive(...)` and
 * the plan becomes a target for commands and extensions. The setter stays
 * with the step.
 */
export const createCell = <T>(initial: T): [Cell<T>, Setter<T>] => {
  // eslint-disable-next-line solid/reactivity -- Stored whole.
  const signal = createSignal(initial);
  signals.set(signal[0], signal as Signal<unknown>);

  // Branded: only `createCell` makes cells.
  return signal as [Cell<T>, Setter<T>];
};

/**
 * Define a cell. `init` runs when the plan is first held and seeds the
 * value from whatever the earlier step yields. Each live plan owns one
 * cell, and the value ends with it.
 */
export const defineCell = <T, Input = void>(
  init: (input: Input) => T,
): Plan<Input, Reactive<T, 'sync', Cell<T>>, 'sync'> =>
  pipe([
    (input: Input) => {
      const [read] = createCell(init(input));
      return reactive(read);
    },
  ]);

/**
 * The signal behind a cell's accessor, for commits to write through.
 *
 * @internal
 */
export const writable = <T>(read: Accessor<T>): Signal<T> => {
  const signal = signals.get(read);
  assert(signal, 'Not a cell.');

  // Keyed by its own accessor, so the types match.
  return signal as Signal<T>;
};
