/** Marks a resource. */
const RESOURCE: unique symbol = Symbol('resource');

/** Releases whatever a resource holds. May be async. */
export type Dispose = () => void | PromiseLike<unknown>;

/**
 * A task output paired with its cleanup. Downstream tasks receive the bare
 * `value`; the runtime keeps `dispose` and runs it when the node is
 * released.
 */
export interface Resource<T> {
  readonly [RESOURCE]: true;
  readonly value: T;
  readonly dispose: Dispose;
}

/**
 * Wrap a long-lived value (a media stream, a socket, a subscription) with
 * the function that tears it down. Return it from a task; the graph owns
 * the lifetime from there.
 */
export const resource = <T>(value: T, dispose: Dispose): Resource<T> => ({
  [RESOURCE]: true,
  value,
  dispose,
});
