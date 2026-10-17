import { assert } from '@lib/assert';
import type { Flow } from '../flow';
import {
  acquire,
  compute,
  createManager,
  inspect,
  release,
  setSource,
  type Manager,
} from '../manager';
import type { Source } from '../source';

/** Drives flows against a fresh manager and tears them down after. */
export interface TestController extends AsyncDisposable {
  /** The manager under test, for assertions that need to look inside. */
  readonly manager: Manager;

  /**
   * Acquire the flow, compute it, and return its output values. The
   * handle stays live until the controller is disposed.
   */
  run<Outputs extends readonly unknown[]>(
    flow: Flow<[], Outputs>,
  ): Promise<Outputs>;

  /** Change a source's value and wait for every flow reading it. */
  setSource<Value>(src: Source<Value>, value: Value): Promise<void>;
}

/**
 * A fresh manager per test, so nothing is shared or cached across tests.
 * Bind it with `await using`; disposal releases every handle still live
 * and rejects with an `AggregateError` if any cleanup threw.
 */
export const createTestController = (): TestController => {
  const manager = createManager();

  return {
    manager,

    run: async <Outputs extends readonly unknown[]>(
      flow: Flow<[], Outputs>,
    ): Promise<Outputs> => {
      const handle = acquire(manager, flow);
      await compute(manager, handle);

      const values: readonly unknown[] = handle.outputs.map((node) => {
        const state = inspect(handle, node);
        assert(state.step === 'succeeded', 'Output did not succeed.');

        return state.value;
      });

      // The graph is untyped at runtime; the flow's signature vouches.
      return values as Outputs;
    },

    setSource: (src, value) => setSource(manager, src, value),

    [Symbol.asyncDispose]: async () => {
      const results = await Promise.allSettled(
        [...manager.handles].map((handle) => release(manager, handle)),
      );

      const failures = results.flatMap((result): unknown[] => {
        if (result.status === 'fulfilled') return [];
        const reason: unknown = result.reason;

        return reason instanceof AggregateError
          ? (reason.errors as unknown[])
          : [reason];
      });

      if (failures.length > 0) {
        throw new AggregateError(failures, 'Teardown failed.');
      }
    },
  };
};
