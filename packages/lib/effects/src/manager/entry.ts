import { createSignal, type Accessor, type Setter } from 'solid-js';
import type { Join, PlanNode } from '../plan';
import { disposeOf, yieldOf, type Dispose, type Task } from '../task';
import { chain, from, later, now, toPromise, type Eventual } from '../eventual';
import type * as Node from './node';

/** Where a started computation stands. */
export type EntryState = Node.Computing | Node.Succeeded | Node.Failed;

/** One computation: a node applied to one exact input. */
export interface Entry {
  readonly kind: PlanNode['kind'];

  /** The node's identity: its task, or the plan that built its join. */
  readonly key: object;

  /** The upstream output the node is keyed on, or `ROOT`. */
  readonly input: unknown;

  /** A join's branch outputs, which it joins. Empty for a task. */
  readonly sources: readonly unknown[];

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

/** What a root node reads as its input. Shared, so roots key alike. */
export const ROOT: unique symbol = Symbol('root');

// TODO: Keying joins by plan splits equal `collect(branches, fn)` calls
// into separate entries, running `fn` once for each. See `collect`.

/** The identity a node's entries are cached under. */
export const keyOf = (node: PlanNode): object =>
  node.kind === 'task' ? node.task : node.plan;

const invoke = (fn: Task | Join, args: readonly unknown[]) =>
  // The one place a task runs. Its real input was checked when the plan
  // was composed; here it's whatever upstream yields.
  (fn as (...yields: unknown[]) => unknown)(...args.map(yieldOf));

/** What a node's state reports as its input: nothing for a root. */
const reported = (input: unknown) => (input === ROOT ? undefined : input);

interface Evaluated {
  readonly output: unknown;
  readonly dispose?: Dispose;
}

const evaluate = (node: PlanNode, entry: Entry): Eventual<Evaluated> => {
  // A join's `fn` runs like a task, over its branches. A root task gets
  // no argument.
  const fn = node.kind === 'task' ? node.task : node.fn;
  const args =
    node.kind === 'join'
      ? entry.sources
      : entry.input === ROOT
        ? []
        : [entry.input];

  // The output keeps what the task returned, wrapper and all, so bindings
  // can tell what kind it is. Downstream tasks receive its `yieldOf`.
  // Only a promise makes the node wait.
  const output = from<unknown>(invoke(fn, args));

  return chain(output, (value) =>
    now({ output: value, dispose: disposeOf(value) }),
  );
};

const run = (
  entry: Entry,
  node: PlanNode,
  setState: Setter<EntryState>,
): Eventual<void> => {
  const input = reported(entry.input);
  const succeed = ({ output, dispose }: Evaluated) => {
    entry.dispose = dispose;
    setState({ step: 'succeeded', input, output });
  };
  const fail = (error: unknown) => {
    setState({ step: 'failed', input, error });
  };

  let evaluated;
  try {
    evaluated = evaluate(node, entry);
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
  input: unknown,
  sources: readonly unknown[],
): Entry => {
  const [state, setState] = createSignal<EntryState>({
    step: 'computing',
    input: reported(input),
  });

  const entry: Entry = {
    kind: node.kind,
    key: keyOf(node),
    input,
    sources,
    state,
    refs: 0,
    settled: Promise.resolve(),
  };

  entry.settled = toPromise(run(entry, node, setState));
  return entry;
};
