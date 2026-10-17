import { createSignal, type Accessor, type Setter } from 'solid-js';
import { isResource, type Dispose, type Task } from '../task';
import type { ComputingState, FailedState, SucceededState } from './state';

/** Where a started computation stands. */
export type EntryState = ComputingState | SucceededState | FailedState;

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

const run = async (entry: Entry, setState: Setter<EntryState>) => {
  const { task, inputs } = entry;

  try {
    const output: unknown = await invoke(task, inputs);
    if (isResource(output)) {
      entry.dispose = output.dispose;
      setState({ step: 'succeeded', inputs, value: output.value });
    } else {
      setState({ step: 'succeeded', inputs, value: output });
    }
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
