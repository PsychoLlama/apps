/** The node's inputs aren't known yet, or an upstream node failed. */
export interface PendingState {
  readonly step: 'pending';
}

/** The task is running. */
export interface ComputingState {
  readonly step: 'computing';

  /** The exact values the task was called with. */
  readonly inputs: readonly unknown[];
}

/** The task threw. The error stays cached alongside the inputs. */
export interface FailedState {
  readonly step: 'failed';

  /** The exact values the task was called with. */
  readonly inputs: readonly unknown[];

  /** Whatever the task threw or rejected with. */
  readonly error: unknown;
}

/** The task finished. */
export interface SucceededState {
  readonly step: 'succeeded';

  /** The exact values the task was called with. */
  readonly inputs: readonly unknown[];

  /** The task's output, with any resource wrapper removed. */
  readonly value: unknown;
}

/** Where a node stands. Snapshots are immutable; transitions replace them. */
export type NodeState =
  PendingState | ComputingState | FailedState | SucceededState;
