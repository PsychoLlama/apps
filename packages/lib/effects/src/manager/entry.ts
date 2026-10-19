import { createSignal, type Accessor, type Setter } from 'solid-js';
import type { FlowNode } from '../flow';
import { isReactive, isResource, type Dispose, type Task } from '../task';
import type * as Node from './node';

/** Where a started computation stands. */
export type EntryState = Node.Computing | Node.Succeeded | Node.Failed;

/** An output tuple, compared by identity when it feeds another node. */
export type Tuple = readonly unknown[];

/** One computation: a node applied to one exact set of upstream tuples. */
export interface Entry {
  /** The node's identity: its task, or the flow that built its join. */
  readonly key: object;

  /** The upstream output tuples: one for a task, one per join branch. */
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

/** What a root task reads as its upstream tuple. Shared, so roots key alike. */
export const ROOT: Tuple = [];

/** The identity a node's entries are cached under. */
export const keyOf = (node: FlowNode): object =>
  node.kind === 'task' ? node.task : node.flow;

const invoke = (task: Task, inputs: Tuple) =>
  // The one place a task runs. Its real inputs were checked when the
  // flow was composed; here they're whatever upstream produced.
  (task as Task<Tuple>)(...inputs);

/** Split a task's output into what downstream receives and its cleanup. */
const unwrap = (output: unknown): { value: unknown; dispose?: Dispose } => {
  if (isResource(output)) return output;
  if (isReactive(output)) {
    return { value: output.state, dispose: output.dispose };
  }

  return { value: output };
};

/** What the node was computed from, as its state reports it. */
const inputsOf = (node: FlowNode, sources: readonly Tuple[]): Tuple =>
  node.kind === 'task' ? (sources[0] ?? ROOT) : sources;

const evaluate = async (
  node: FlowNode,
  sources: readonly Tuple[],
): Promise<{ outputs: Tuple; dispose?: Dispose }> => {
  if (node.kind === 'join') return { outputs: sources.flat() };

  const { value, dispose } = unwrap(
    await invoke(node.task, inputsOf(node, sources)),
  );

  // Tasks return one value, since JS has no multiple returns. Boxing it
  // here gives the tuple its one identity for downstream keys.
  return { outputs: [value], dispose };
};

const run = async (
  entry: Entry,
  node: FlowNode,
  setState: Setter<EntryState>,
) => {
  const inputs = inputsOf(node, entry.sources);

  try {
    const { outputs, dispose } = await evaluate(node, entry.sources);
    entry.dispose = dispose;
    setState({ step: 'succeeded', inputs, outputs });
  } catch (error) {
    setState({ step: 'failed', inputs, error });
  }
};

/** Start the node and track its outcome. */
export const spawn = (node: FlowNode, sources: readonly Tuple[]): Entry => {
  const [state, setState] = createSignal<EntryState>({
    step: 'computing',
    inputs: inputsOf(node, sources),
  });

  const entry: Entry = {
    key: keyOf(node),
    sources,
    state,
    refs: 0,
    settled: Promise.resolve(),
  };

  entry.settled = run(entry, node, setState);
  return entry;
};
