import { createSignal, type Accessor, type Setter } from 'solid-js';
import { isReactive, isResource, type Dispose, type Task } from '../task';
import type * as Node from './node';

/** Where a started computation stands. */
export type EntryState = Node.Computing | Node.Succeeded | Node.Failed;

/** One computation: a task applied to one exact input tuple. */
export interface Entry {
  readonly task: Task;
  readonly inputs: readonly unknown[];

  /** Reactive. Tracks under a Solid computation, reads plainly outside. */
  readonly state: Accessor<EntryState>;

  /** Handles currently bound to this entry. */
  refs: number;

  /** Cleanup for the resource the task produced, if it produced one. */
  dispose?: Dispose;

  /** Resolves when the task settles, whichever way. Never rejects. */
  settled: Promise<void>;

  /** Set once retired. Resolves when the key is free for a new life. */
  retired?: Promise<void>;
}

const invoke = (task: Task, inputs: readonly unknown[]) =>
  // The one place a task runs. Its real inputs were checked when the
  // flow was composed; here they're whatever upstream produced.
  (task as Task<readonly unknown[]>)(...inputs);

/** Split a task's output into what downstream receives and its cleanup. */
const unwrap = (output: unknown): { value: unknown; dispose?: Dispose } => {
  if (isResource(output)) return output;
  if (isReactive(output)) {
    return { value: output.state, dispose: output.dispose };
  }

  return { value: output };
};

const run = async (entry: Entry, setState: Setter<EntryState>) => {
  const { task, inputs } = entry;

  try {
    const { value, dispose } = unwrap(await invoke(task, inputs));
    entry.dispose = dispose;
    setState({ step: 'succeeded', inputs, value });
  } catch (error) {
    setState({ step: 'failed', inputs, error });
  }
};

/** Start the task and track its outcome. */
export const spawn = (task: Task, inputs: readonly unknown[]): Entry => {
  const [state, setState] = createSignal<EntryState>({
    step: 'computing',
    inputs,
  });

  const entry: Entry = {
    task,
    inputs,
    state,
    refs: 0,
    settled: Promise.resolve(),
  };

  entry.settled = run(entry, setState);
  return entry;
};
