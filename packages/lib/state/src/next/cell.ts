import { createSignal, type Accessor, type Signal } from 'solid-js';
import { assert } from '@lib/assert';
import { pipe, reactive, type Plan, type Reactive } from '@lib/effects';

declare const CELL: unique symbol;

/**
 * A reactive value, for state that isn't an object. Read it like any
 * signal; write it from `defineCommand` or `defineExtension`.
 */
export type Cell<T> = Reactive<T, 'sync'> & {
  // Phantom. Keeps arbitrary reactive values from passing as cells.
  readonly [CELL]: T;
};

// Each live cell's signal, keyed by the accessor readers get. Only commits
// recover the setter.
const signals = new WeakMap<Accessor<unknown>, Signal<unknown>>();

/**
 * Define a cell. `init` runs when the plan is first held and seeds the
 * value from whatever the earlier step yields. Each live plan owns one
 * cell, and the value ends with it.
 */
export const defineCell = <T, Input = void>(
  init: (input: Input) => T,
): Plan<Input, Cell<T>, 'sync'> =>
  pipe([
    (input: Input) => {
      // eslint-disable-next-line solid/reactivity -- Stored whole.
      const signal = createSignal(init(input));

      const [read] = signal;
      signals.set(read, signal as Signal<unknown>);

      // Branded: only `defineCell` makes cells.
      return reactive(read) as Cell<T>;
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
