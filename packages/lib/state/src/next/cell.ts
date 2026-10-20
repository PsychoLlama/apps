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
 * value from whatever earlier steps yield. Each live plan owns one cell,
 * and the value ends with it.
 */
export const defineCell = <T, Inputs extends readonly unknown[] = []>(
  init: (...inputs: Inputs) => T,
): Plan<Inputs, [Cell<T>], 'sync'> =>
  // Generic steps defeat `pipe` inference. The signature vouches.
  pipe([
    (...inputs: readonly unknown[]) => {
      // eslint-disable-next-line solid/reactivity -- Stored whole.
      const signal = createSignal(init(...(inputs as Inputs)));

      const [read] = signal;
      signals.set(read, signal as Signal<unknown>);

      return reactive(read);
    },
  ]) as unknown as Plan<Inputs, [Cell<T>], 'sync'>;

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
