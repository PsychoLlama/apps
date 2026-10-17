/**
 * Where a node of an acquired flow stands. Imported as a namespace:
 * `Node.State`, `Node.Succeeded`, and so on.
 */

/** The node's inputs aren't known yet, or an upstream node failed. */
export interface Pending {
  readonly step: 'pending';
}

/** The task is running. */
export interface Computing {
  readonly step: 'computing';

  /** The exact values the task was called with. */
  readonly inputs: readonly unknown[];
}

/** The task threw. The error stays cached alongside the inputs. */
export interface Failed {
  readonly step: 'failed';

  /** The exact values the task was called with. */
  readonly inputs: readonly unknown[];

  /** Whatever the task threw or rejected with. */
  readonly error: unknown;
}

/** The task finished. */
export interface Succeeded<Value = unknown> {
  readonly step: 'succeeded';

  /** The exact values the task was called with. */
  readonly inputs: readonly unknown[];

  /** The task's output, with any resource wrapper removed. */
  readonly value: Value;
}

/** Snapshots are immutable; transitions replace them. */
export type State<Value = unknown> =
  Pending | Computing | Failed | Succeeded<Value>;
