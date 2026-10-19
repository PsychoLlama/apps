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

  /** A task's exact arguments, or a join's branch tuples. */
  readonly inputs: readonly unknown[];
}

/** The task threw. The error stays cached alongside the inputs. */
export interface Failed {
  readonly step: 'failed';

  /** A task's exact arguments, or a join's branch tuples. */
  readonly inputs: readonly unknown[];

  /** Whatever the task threw or rejected with. */
  readonly error: unknown;
}

/** The node finished. */
export interface Succeeded<
  Outputs extends readonly unknown[] = readonly unknown[],
> {
  readonly step: 'succeeded';

  /** A task's exact arguments, or a join's branch tuples. */
  readonly inputs: readonly unknown[];

  /**
   * The node's output tuple, created once and shared with every handle,
   * so downstream nodes can key on its identity. A task's holds its one
   * value with any resource wrapper removed; a reactive output leaves its
   * accessor.
   */
  readonly outputs: Outputs;
}

/** Snapshots are immutable; transitions replace them. */
export type State<Outputs extends readonly unknown[] = readonly unknown[]> =
  Pending | Computing | Failed | Succeeded<Outputs>;
