/**
 * Whether work completes in the same tick (`sync`) or may have to wait
 * (`async`). Tracked at the type level only: a plan is `sync` when none
 * of its tasks return a promise or a resource with async cleanup.
 */
export type Mode = 'sync' | 'async';

/**
 * The mode of a value as returned: `async` if it may be a promise. `any`
 * and `unknown` may be one, so they count as `async`.
 */
export type ModeOf<Value> = 0 extends 1 & Value
  ? 'async'
  : unknown extends Value
    ? 'async'
    : [Extract<Value, PromiseLike<unknown>>] extends [never]
      ? 'sync'
      : 'async';

/** One mode for several: `async` if any of them is. */
export type Combine<M extends Mode> = 'async' extends M ? 'async' : 'sync';
