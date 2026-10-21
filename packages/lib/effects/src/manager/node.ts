/**
 * Where a node of an acquired plan stands. Imported as a namespace:
 * `Node.State`, `Node.Succeeded`, and so on.
 */

/** The node's input isn't known yet, or an upstream node failed. */
export interface Pending {
  readonly step: 'pending';
}

/** The task is running. */
export interface Computing {
  readonly step: 'computing';

  /** The upstream output: what the task receives. `undefined` at a root. */
  readonly input: unknown;
}

/** The task threw. The error stays cached alongside the input. */
export interface Failed {
  readonly step: 'failed';

  /** The upstream output: what the task receives. `undefined` at a root. */
  readonly input: unknown;

  /** Whatever the task threw or rejected with. */
  readonly error: unknown;
}

/** The node finished. */
export interface Succeeded<Output = unknown> {
  readonly step: 'succeeded';

  /** The upstream output: what the task receives. `undefined` at a root. */
  readonly input: unknown;

  /**
   * The node's output as returned, `resource` or `reactive` wrapper
   * included. Downstream nodes key on it by value.
   */
  readonly output: Output;
}

/** Snapshots are immutable; transitions replace them. */
export type State<Output = unknown> =
  Pending | Computing | Failed | Succeeded<Output>;
