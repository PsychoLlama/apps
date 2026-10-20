import { onCleanup, untrack } from 'solid-js';
import { assert } from '@lib/assert';
import type { Flow } from '../flow';
import { yieldOf, type Yield } from '../task';
import { useController } from './context';
import { acquire } from './flow-resource';

type AnyFunction = (...args: never[]) => unknown;

/** The wrapper `useAction` returns for a flow whose output is a function. */
export type Action<Output> =
  Yield<Output> extends (...args: infer Args) => infer Result
    ? (...args: Args) => Promise<Awaited<Result>>
    : never;

/**
 * Count holds, running `idle` once when the last one is released. Holds
 * taken after that count for nothing. Each hold returns its release.
 */
const refCount = (idle: () => void) => {
  let holds = 0;
  let done = false;

  return () => {
    holds += 1;

    return () => {
      holds -= 1;
      if (holds > 0 || done) return;

      done = true;
      idle();
    };
  };
};

/**
 * Call a flow's output as a function from event handlers. The flow
 * computes on the first call, so its dependencies resolve then. Once
 * computed, calls go straight through, synchronously, which keeps APIs
 * that need a user gesture working. The flow is held from render until
 * the component unmounts and every call has settled.
 *
 * Takes a flow with one output: the function, as a downstream task would
 * receive it.
 */
export const useAction = <
  Outputs extends [unknown] & {
    [Index in keyof Outputs]: Yield<Outputs[Index]> extends AnyFunction
      ? Outputs[Index]
      : never;
  },
>(
  flow: Flow<[], Outputs>,
): Action<Outputs[0]> => {
  const controller = useController();
  const [handle, release] = acquire(flow);
  const hold = refCount(release);
  onCleanup(hold());

  const output = () => controller.inspect(handle, handle.output);

  const action = async (...args: unknown[]) => {
    const done = hold();

    try {
      let state = untrack(output);
      if (state.step !== 'succeeded') {
        await controller.compute(handle);
        state = output();
        assert(state.step === 'succeeded', 'Flow computed without an output.');
      }

      // The graph is untyped at runtime; the flow's signature vouches.
      const call = yieldOf(state.outputs[0]) as (...rest: unknown[]) => unknown;
      return await call(...args);
    } finally {
      done();
    }
  };

  return action as Action<Outputs[0]>;
};
