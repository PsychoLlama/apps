import { FLOW, type Flow, type FlowNode } from './flow';
import type { Task } from './task';

/** Marks a source task and carries the source's initial value. */
export const SOURCE: unique symbol = Symbol('source');

/**
 * The task standing in for a source's node. It passes the current value
 * through, so the node is cached and shared like any other: keyed by the
 * task and the value.
 */
export interface SourceTask<Value> extends Task {
  readonly [SOURCE]: Value;
}

/**
 * An input to the graph that changes over time. Module-level constant;
 * each manager tracks its own current value, starting from the initial.
 */
export interface Source<Value> extends Flow<[], [Value]> {
  readonly [SOURCE]: SourceTask<Value>;
}

export const source = <Value>(initial: Value): Source<Value> => {
  const task: SourceTask<Value> = Object.assign((value: Value) => value, {
    [SOURCE]: initial,
  });

  const node: FlowNode = { task, inputs: [] };

  return {
    [FLOW]: () => ({ nodes: [node], outputs: [node] }),
    [SOURCE]: task,
  };
};

export const isSourceTask = (task: Task): task is SourceTask<unknown> =>
  SOURCE in task;
