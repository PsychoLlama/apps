/** Marks a collected output. */
const COLLECTED: unique symbol = Symbol('collected');

/**
 * The output of `collect`: its branches' outputs as returned, wrappers
 * and all. Downstream tasks receive the unwrapped `value`. Built by the
 * runtime, never by tasks.
 */
export interface Collected<T extends readonly unknown[]> {
  readonly [COLLECTED]: true;
  readonly items: readonly unknown[];
  readonly value: T;
}

/** Box branch outputs, unwrapped once so `value` keeps one identity. */
export const collected = (
  items: readonly unknown[],
  unwrap: (output: unknown) => unknown,
): Collected<readonly unknown[]> => ({
  [COLLECTED]: true,
  items,
  value: items.map(unwrap),
});

/** Whether an output came from `collect`. */
export const isCollected = (
  output: unknown,
): output is Collected<readonly unknown[]> =>
  typeof output === 'object' && output !== null && COLLECTED in output;
