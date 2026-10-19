import type { Accessor } from 'solid-js';
import type { Dispose } from './resource';

/** Marks a reactive output. */
const REACTIVE: unique symbol = Symbol('reactive');

/**
 * A task output that changes over time, paired with an optional cleanup.
 * Downstream tasks receive the bare accessor; the runtime keeps `dispose`
 * and runs it when the node is released.
 */
export interface Reactive<T> {
  readonly [REACTIVE]: true;
  readonly state: Accessor<T>;
  readonly dispose?: Dispose;
}

/**
 * Wrap state that changes on its own (a track's mute flag, a connection's
 * status) for Solid bindings to read reactively. Downstream tasks get the
 * accessor but run once; reading it there is a snapshot, not a
 * subscription.
 */
export const reactive = <T>(
  state: Accessor<T>,
  dispose?: Dispose,
): Reactive<T> => ({
  [REACTIVE]: true,
  state,
  dispose,
});

/** Whether a task output is reactive. */
export const isReactive = (output: unknown): output is Reactive<unknown> =>
  typeof output === 'object' && output !== null && REACTIVE in output;
