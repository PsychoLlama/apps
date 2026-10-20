import type { Eventual } from '../eventual';
import type { Mode } from '../mode';
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
  readonly acquire: <Outputs extends readonly unknown[], M extends Mode>(
    plan: Plan<[], Outputs, M>,
  ) => Handle<Outputs, M>;

  /**
   * Run every node, sharing cached work with other handles, and return
   * the plan's raw output tuple: right away for a `sync` plan, or for
   * any plan that has settled. Fails with an `AggregateError` of every
   * failure, thrown now or rejected later.
   */
  readonly compute: <Outputs extends readonly unknown[], M extends Mode>(
    handle: Handle<Outputs, M>,
  ) => Eventual<Outputs, M>;

  /**
   * Drop the handle's references and tear down whatever nothing else
   * holds, downstream first. Whatever doesn't wait is torn down before
   * this returns.
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
