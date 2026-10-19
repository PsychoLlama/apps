import { createSignal, type Accessor, type Setter } from 'solid-js';
import type { FlowNode } from '../flow';
import {
  collected,
  disposeOf,
  yieldOf,
  type Dispose,
  type Task,
} from '../task';
import type { Tuple } from './cache';
import type * as Node from './node';

/** Where a started computation stands. */
export type EntryState = Node.Computing | Node.Succeeded | Node.Failed;

/** One computation: a node applied to one exact input tuple. */
export interface Entry {
  readonly kind: FlowNode['kind'];

  /** The node's identity: its task, or the flow that built its join. */
  readonly key: object;

  /** The upstream output tuple the node is keyed on. */
  readonly inputs: Tuple;

  /** A join's branch tuples, which it concatenates. Empty for a task. */
  readonly sources: readonly Tuple[];

  /** Reactive. Tracks under a Solid computation, reads plainly outside. */
  readonly state: Accessor<EntryState>;

  /** Handles currently bound to this entry. */
  refs: number;

  /** Cleanup for the resource the task produced, if it produced one. */
  dispose?: Dispose;

  /** Resolves when the node settles, whichever way. Never rejects. */
  settled: Promise<void>;

  /** Set once retired. Resolves when the key is free for a new life. */
  retired?: Promise<void>;
}

/** Boxes a task's output as its output tuple, one identity per value. */
export type Intern = (value: unknown) => Tuple;

/** What a root node reads as its input. Shared, so roots key alike. */
export const ROOT: Tuple = [];

/** The identity a node's entries are cached under. */
export const keyOf = (node: FlowNode): object =>
  node.kind === 'task' ? node.task : node.flow;

const invoke = (task: Task, inputs: Tuple) =>
  // The one place a task runs. Its real inputs were checked when the
  // flow was composed; here they're whatever upstream yields.
  (task as Task<unknown[]>)(...inputs.map(yieldOf));

const evaluate = async (
  node: FlowNode,
  entry: Entry,
  intern: Intern,
): Promise<{ outputs: Tuple; dispose?: Dispose }> => {
  if (node.kind === 'join') {
    const joined = entry.sources.flat();
    return { outputs: node.collect ? [collected(joined, yieldOf)] : joined };
  }

  // Outputs keep what the task returned, wrappers and all, so bindings
  // can tell what kind it is. Downstream tasks receive its `yieldOf`.
  const output: unknown = await invoke(node.task, entry.inputs);

  // Tasks return one value, since JS has no multiple returns. Interning
  // the box gives equal values one identity for downstream keys.
  return { outputs: intern(output), dispose: disposeOf(output) };
};

const run = async (
  entry: Entry,
  node: FlowNode,
  intern: Intern,
  setState: Setter<EntryState>,
) => {
  const { inputs } = entry;

  try {
    const { outputs, dispose } = await evaluate(node, entry, intern);
    entry.dispose = dispose;
    setState({ step: 'succeeded', inputs, outputs });
  } catch (error) {
    setState({ step: 'failed', inputs, error });
  }
};

/** Start the node and track its outcome. */
export const spawn = (
  node: FlowNode,
  inputs: Tuple,
  sources: readonly Tuple[],
  intern: Intern,
): Entry => {
  const [state, setState] = createSignal<EntryState>({
    step: 'computing',
    inputs,
  });

  const entry: Entry = {
    kind: node.kind,
    key: keyOf(node),
    inputs,
    sources,
    state,
    refs: 0,
    settled: Promise.resolve(),
  };

  entry.settled = run(entry, node, intern, setState);
  return entry;
};
