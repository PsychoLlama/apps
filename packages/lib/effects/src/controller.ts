import type { Flow, FlowNode } from './flow';
import {
  acquire,
  compute,
  inspect,
  release,
  setSource,
  type Handle,
  type Manager,
  type NodeState,
} from './manager';
import type { Source } from './source';

/** The manager's operations, bound to one manager. */
export interface Controller {
  /** Build the flow's graph and register it. Nothing runs until computed. */
  acquire(flow: Flow<[]>): Handle;

  /**
   * Run every node, sharing cached work with other handles. Resolves once
   * all nodes settle; rejects with an `AggregateError` of every failure.
   */
  compute(handle: Handle): Promise<void>;

  /**
   * Drop the handle's references and tear down whatever nothing else
   * holds, downstream first.
   */
  release(handle: Handle): Promise<void>;

  /** The current state of one of the handle's nodes. Reactive. */
  inspect(handle: Handle, node: FlowNode): NodeState;

  /** Change a source's value and rebind everything downstream of it. */
  setSource<Value>(src: Source<Value>, value: Value): Promise<void>;
}

export const createController = (manager: Manager): Controller => ({
  acquire: (flow) => acquire(manager, flow),
  compute: (handle) => compute(manager, handle),
  release: (handle) => release(manager, handle),
  inspect,
  setSource: (src, value) => setSource(manager, src, value),
});
