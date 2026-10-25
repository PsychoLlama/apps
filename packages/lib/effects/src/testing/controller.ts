import type { Accessor, Component, ParentProps } from 'solid-js';
import { createController } from '../controller/controller';
import { toPromise } from '../eventual';
import type { Plan } from '../plan';
import {
  acquire,
  compute,
  createManager,
  release,
  type Handle,
} from '../manager';
import { yieldOf, type Yield } from '../task';
import { createRenderContext } from './render-context';

/**
 * One hold on a plan, for tests that control its lifetime. Call it to
 * compute the plan and get what it yields; safe to call repeatedly. Bind
 * it with `await using`; leaving the scope releases the hold.
 */
export interface Hold<Output> extends AsyncDisposable {
  (): Promise<Yield<Output>>;
}

/** Options for {@link TestController.createRenderContext}. */
export interface RenderContextOptions {
  /**
   * Stands in for the root's mount tracking, for tests that flip it by
   * hand. Defaults to tracking the mount like `EffectsRoot`.
   */
  readonly mounted?: Accessor<boolean>;
}

/** Drives plans against a fresh manager and tears them down after. */
export interface TestController extends AsyncDisposable {
  /** How many holds are live: every plan computed and not yet released. */
  readonly holds: number;

  /**
   * Hold the plan, compute it, and return what it yields. The hold lasts
   * until the controller is disposed.
   */
  run<Output>(plan: Plan<void, Output>): Promise<Yield<Output>>;

  /**
   * Hold the plan for the scope it's bound to, for tests that control its
   * lifetime. Nothing runs until it's called.
   */
  use<Output>(plan: Plan<void, Output>): Hold<Output>;

  /**
   * A root for rendering components against this controller, in place of
   * `EffectsRoot`.
   */
  createRenderContext(options?: RenderContextOptions): Component<ParentProps>;
}

/**
 * A fresh manager per test, so nothing is shared or cached across tests.
 * Bind it with `await using`; disposal releases every handle still live
 * and rejects with an `AggregateError` if any cleanup threw.
 */
export const createTestController = (): TestController => {
  const manager = createManager();

  // `yieldOf` is untyped; the plan's signature vouches.
  const settle = async <Output>(
    handle: Handle<Output>,
  ): Promise<Yield<Output>> =>
    yieldOf(await toPromise(compute(manager, handle))) as Yield<Output>;

  // Releases a hold's scope let go of without waiting for.
  const deferred: Promise<void>[] = [];

  return {
    get holds() {
      return manager.handles.size;
    },

    run: (plan) => settle(acquire(plan)),

    use: <Output>(plan: Plan<void, Output>): Hold<Output> => {
      const handle = acquire(plan);

      return Object.assign(async () => settle(handle), {
        [Symbol.asyncDispose]: async () => {
          const inFlight = [...handle.bindings.values()].some(
            (binding) => binding.type === 'async',
          );
          const released = release(manager, handle);
          if (!inFlight) return released;

          // The release waits for work in flight to land, and that may
          // wait on the test moving past this scope. Leave it to the
          // controller's disposal, which reports its failures.
          released.catch(() => {});
          deferred.push(released);
        },
      });
    },

    createRenderContext: (options) =>
      createRenderContext(createController(manager), options),

    [Symbol.asyncDispose]: async () => {
      const results = await Promise.allSettled([
        ...deferred,
        ...[...manager.handles].map((handle) => release(manager, handle)),
      ]);

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
