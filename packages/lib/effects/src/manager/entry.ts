import { isResource, type Dispose, type Task } from '../task';
import type { ComputingState, FailedState, SucceededState } from './state';

/** One computation: a task applied to one exact input tuple. */
export interface Entry {
  readonly task: Task;
  readonly inputs: readonly unknown[];
  state: ComputingState | SucceededState | FailedState;

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

const run = async (entry: Entry) => {
  const { task, inputs } = entry;

  try {
    const output: unknown = await invoke(task, inputs);
    if (isResource(output)) {
      entry.dispose = output.dispose;
      entry.state = { step: 'succeeded', inputs, value: output.value };
    } else {
      entry.state = { step: 'succeeded', inputs, value: output };
    }
  } catch (error) {
    entry.state = { step: 'failed', inputs, error };
  }
};

/** Start the task and track its outcome. */
export const spawn = (task: Task, inputs: readonly unknown[]): Entry => {
  const entry: Entry = {
    task,
    inputs,
    refs: 0,
    state: { step: 'computing', inputs },
    settled: Promise.resolve(),
  };

  entry.settled = run(entry);
  return entry;
};
