import type { AnyCapability, AnyFact, AnySpaceRef } from './internal';
import { drive, type DriveContext, type SagaGen } from './saga';

/** Everything a simulated saga did: commits, spawns, and return value. */
export interface SimulationTrace<Return> {
  /** One entry per transition, each carrying its facts in commit order. */
  readonly commits: ReadonlyArray<readonly AnyFact[]>;
  /** Detached children the saga spawned. Recorded, never executed. */
  readonly spawns: ReadonlyArray<SagaGen>;
  /** The saga's return value. */
  readonly result: Return;
}

/** Stub tables for {@link simulate}, matched by identity. */
export interface SimulateOptions {
  /** Capability stubs: `[real, stub]` pairs. Stubs receive `(signal, ...args)`. */
  readonly calls?: ReadonlyArray<readonly [AnyCapability, AnyCapability]>;
  /** Read stubs: `[ref, value]` pairs served to `read` instructions. */
  readonly reads?: ReadonlyArray<readonly [AnySpaceRef, unknown]>;
}

/**
 * Drive a saga against stub tables — no runtime, no scopes, no state.
 * The trace records exactly what the saga published, which makes commit
 * batching (`atomic` fusion included) directly assertable.
 */
export const simulate = async <Return>(
  gen: SagaGen<Return>,
  options: SimulateOptions = {},
): Promise<SimulationTrace<Return>> => {
  const stubs = new Map(options.calls ?? []);
  const reads = new Map(options.reads ?? []);
  const commits: Array<readonly AnyFact[]> = [];
  const spawns: SagaGen[] = [];
  const controller = new AbortController();

  const context: DriveContext = {
    signal: controller.signal,
    sink: (facts) => commits.push(facts),
    call: (signal, fn, args) => {
      const stub = stubs.get(fn);
      if (!stub) {
        throw new Error(
          `simulate: no stub for capability "${fn.name || 'anonymous'}"`,
        );
      }
      return (stub as (...rest: unknown[]) => unknown)(signal, ...args);
    },
    read: (ref) => {
      if (!reads.has(ref)) {
        throw new Error('simulate: no stubbed value for read');
      }
      return reads.get(ref);
    },
    spawn: (child) => {
      spawns.push(child);
      // Close the unstarted generator; it never executes in a simulation.
      void child.return(undefined);
    },
  };

  const result = await drive(gen, context);
  return { commits, spawns, result };
};
