import type { Plan, Reactive } from '@lib/effects';
import { unimplemented } from './unimplemented';

declare const CELL: unique symbol;

/**
 * A reactive value, for state that isn't an object. Read it like any
 * signal; write it from `defineChange` or `defineAction`.
 */
export type Cell<T> = Reactive<T, 'sync'> & {
  // Phantom. Keeps arbitrary reactive values from passing as cells.
  readonly [CELL]: T;
};

/**
 * Define a cell. `init` runs when the plan is first held and seeds the
 * value from whatever earlier steps yield. Each live plan owns one cell,
 * and the value ends with it.
 */
export const defineCell = <T, Inputs extends readonly unknown[] = []>(
  init: (...inputs: Inputs) => T,
): Plan<Inputs, [Cell<T>], 'sync'> => unimplemented(init);
