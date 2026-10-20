import { createSignal, type Accessor, type Setter } from 'solid-js';
import type { PlanNode } from '../plan';
import { disposeOf, yieldOf, type Dispose, type Task } from '../task';
import { chain, from, later, now, toPromise, type Eventual } from '../eventual';
import type { Tuple } from './cache';
import type * as Node from './node';

/** Where a started computation stands. */
export type EntryState = Node.Computing | Node.Succeeded | Node.Failed;

/** One computation: a node applied to one exact input tuple. */
export interface Entry {
  readonly kind: PlanNode['kind'];

  /** The node's identity: its task, or the plan that built its join. */
  readonly key: object;

  /** The upstream output tuple the node is keyed on. */
  readonly inputs: Tuple;

  /** A join's branch tuples, which it joins. Empty for a task. */
  readonly sources: readonly Tuple[];

  /** Reactive. Tracks under a Solid computation, reads plainly outside. */
  readonly state: Accessor<EntryState>;

  /** Handles currently bound to this entry. */
  refs: number;

  /** Cleanup for the resource the task produced, if it produced one. */
  dispose?: Dispose;

  /**
   * Resolves when the node settles, whichever way. Never rejects. Read
   * `state` first: a node that didn't wait has already settled.
   */
  settled: Promise<void>;

  /**
   * Set if retiring has to wait. Settles when the key is free for a new
   * life. A retirement that doesn't wait frees the key right away.
   */
  retired?: Promise<unknown>;
}

/** Boxes a task's output as its output tuple, one identity per value. */
export type Intern = (value: unknown) => Tuple;

/** What a root node reads as its input. Shared, so roots key alike. */
export const ROOT: Tuple = [];

// TODO: Keying joins by plan splits equal `collect(branches, fn)` calls
// into separate entries, running `fn` once for each. See `collect`.

/** The identity a node's entries are cached under. */
export const keyOf = (node: PlanNode): object =>
  node.kind === 'task' ? node.task : node.plan;

const invoke = (task: Task, inputs: Tuple) =>
  // The one place a task runs. Its real inputs were checked when the
  // plan was composed; here they're whatever upstream yields.
  (task as Task<unknown[]>)(...inputs.map(yieldOf));

interface Evaluated {
  readonly outputs: Tuple;
  readonly dispose?: Dispose;
}

const evaluate = (
  node: PlanNode,
  entry: Entry,
  intern: Intern,
): Eventual<Evaluated> => {
  // A join's `fn` runs like a task, over its branches.
  const task = node.kind === 'task' ? node.task : node.fn;
  const inputs = node.kind === 'task' ? entry.inputs : entry.sources.flat();

  // Outputs keep what the task returned, wrappers and all, so bindings
  // can tell what kind it is. Downstream tasks receive its `yieldOf`.
  // Only a promise makes the node wait.
  const output = from<unknown>(invoke(task, inputs));

  // Tasks return one value, since JS has no multiple returns. Interning
  // the box gives equal values one identity for downstream keys.
  return chain(output, (value) =>
    now({ outputs: intern(value), dispose: disposeOf(value) }),
  );
};

const run = (
  entry: Entry,
  node: PlanNode,
  intern: Intern,
  setState: Setter<EntryState>,
): Eventual<void> => {
  const { inputs } = entry;
  const succeed = ({ outputs, dispose }: Evaluated) => {
    entry.dispose = dispose;
    setState({ step: 'succeeded', inputs, outputs });
  };
  const fail = (error: unknown) => {
    setState({ step: 'failed', inputs, error });
  };

  let evaluated;
  try {
    evaluated = evaluate(node, entry, intern);
  } catch (error) {
    fail(error);
    return now(undefined);
  }

  if (evaluated.type === 'sync') {
    succeed(evaluated.value);
    return now(undefined);
  }

  return later(evaluated.value.then(succeed, fail));
};

/** Start the node and track its outcome. */
export const spawn = (
  node: PlanNode,
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

  entry.settled = toPromise(run(entry, node, intern, setState));
  return entry;
};
