import { assert } from '@lib/assert';
import { createController, type Controller } from '../controller/controller';
import type { Flow } from '../flow';
import { createManager, release, type Manager } from '../manager';

/** Drives flows against a fresh manager and tears them down after. */
export interface TestController extends AsyncDisposable {
  /** The manager under test, for assertions that need to look inside. */
  readonly manager: Manager;

  /**
   * A controller over the same manager, for bindings that take one: give
   * it to a Solid tree through `EffectsRoot`.
   */
  readonly controller: Controller;

  /**
   * Acquire the flow, compute it, and return its output values. The
   * handle stays live until the controller is disposed.
   */
  run<Outputs extends readonly unknown[]>(
    flow: Flow<[], Outputs>,
  ): Promise<Outputs>;
}

/**
 * A fresh manager per test, so nothing is shared or cached across tests.
 * Bind it with `await using`; disposal releases every handle still live
 * and rejects with an `AggregateError` if any cleanup threw.
 */
export const createTestController = (): TestController => {
  const manager = createManager();
  const controller = createController(manager);

  return {
    manager,
    controller,

    run: async <Outputs extends readonly unknown[]>(
      flow: Flow<[], Outputs>,
    ): Promise<Outputs> => {
      const handle = controller.acquire(flow);
      await controller.compute(handle);

      const state = controller.inspect(handle, handle.output);
      assert(state.step === 'succeeded', 'Output did not succeed.');

      // The graph is untyped at runtime; the flow's signature vouches.
      return state.outputs as Outputs;
    },

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
