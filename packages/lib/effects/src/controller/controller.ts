import type { Accessor } from 'solid-js';
import type { Flow, FlowNode } from '../flow';
import {
  acquire,
  bound,
  compute,
  inspect,
  release,
  setSource,
  type Entry,
  type Handle,
  type Manager,
  type Node,
} from '../manager';
import type { Source } from '../source';

/**
 * The manager's operations, bound to one manager. Plain functions, so
 * they can be pulled off and passed around.
 */
export interface Controller {
  /** Build the flow's graph. Nothing runs until computed. */
  readonly acquire: (flow: Flow<[]>) => Handle;

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
  readonly inspect: (handle: Handle, node: FlowNode) => Node.State;

  /** Change a source's value and rebind everything downstream of it. */
  readonly setSource: <Value>(
    src: Source<Value>,
    value: Value,
  ) => Promise<void>;

  /**
   * The entry a node is bound to, `undefined` while pending. Reactive.
   * For bindings that follow a node's life rather than its value.
   */
  readonly bound: (
    handle: Handle,
    node: FlowNode,
  ) => Accessor<Entry | undefined>;
}

export const createController = (manager: Manager): Controller => ({
  acquire,
  compute: (handle) => compute(manager, handle),
  release: (handle) => release(manager, handle),
  inspect,
  setSource: (src, value) => setSource(manager, src, value),
  bound,
});
