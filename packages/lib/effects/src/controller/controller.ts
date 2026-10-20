import type { Plan, PlanNode } from '../plan';
import {
  acquire,
  compute,
  inspect,
  release,
  type Handle,
  type Manager,
  type Node,
} from '../manager';

/**
 * The manager's operations, bound to one manager. Plain functions, so
 * they can be pulled off and passed around.
 */
export interface Controller {
  /** Build the plan's graph. Nothing runs until computed. */
  readonly acquire: (plan: Plan<[]>) => Handle;

  /**
   * Run every node, sharing cached work with other handles. Resolves once
   * all nodes settle; rejects with an `AggregateError` of every failure.
   */
  readonly compute: (handle: Handle) => Promise<void>;

  /**
   * Drop the handle's references and tear down whatever nothing else
   * holds, downstream first.
   */
  readonly release: (handle: Handle) => Promise<void>;

  /** The current state of one of the handle's nodes. Reactive. */
  readonly inspect: (handle: Handle, node: PlanNode) => Node.State;
}

export const createController = (manager: Manager): Controller => ({
  acquire,
  compute: (handle) => compute(manager, handle),
  release: (handle) => release(manager, handle),
  inspect,
});
