import { onCleanup } from 'solid-js';
import { isAbortError } from './abort';
import { commitFacts } from './fold';
import {
  FAILURES,
  OBSERVERS,
  SCOPE,
  STUBS,
  type AnyCapability,
  type AnyFact,
  type AnySpaceRef,
  type Runtime,
  type ScopeRef,
} from './internal';
import { createRuntime, GLOBAL_RUNTIME } from './runtime';
import {
  drive,
  type DriveContext,
  type Saga,
  type SagaInvocation,
} from './saga';
import { anchorScope, getAliveScope } from './scope';
import { peekValue, resolveValue, type Snapshot } from './space';

/** Run a saga invocation against a runtime. Its scope must be anchored. */
const runSaga = <Return>(
  runtime: Runtime,
  invocation: SagaInvocation<Return>,
): Promise<Return> => {
  const scopeRef = invocation[SCOPE] as ScopeRef | undefined;
  if (!scopeRef) {
    throw new Error(
      'Not a saga invocation: create one by calling a defined saga',
    );
  }

  const scope = getAliveScope(runtime, scopeRef);

  const context: DriveContext = {
    signal: scope.controller.signal,
    sink: (facts) => commitFacts(runtime, facts),
    call: (signal, fn, args) =>
      ((runtime[STUBS].get(fn) ?? fn) as (...rest: unknown[]) => unknown)(
        signal,
        ...args,
      ),
    read: (ref) => peekValue(runtime, ref),
    spawn: (child) => {
      // Detached but owned: same scope signal, direct commits. Failures
      // escape loudly instead of vanishing into a dropped promise.
      drive(child, context).catch((error: unknown) => {
        if (isAbortError(error)) return;
        reportFailure(runtime, error);
      });
    },
  };

  return drive(invocation, context);
};

const reportFailure = (runtime: Runtime, error: unknown): void => {
  const failure = error instanceof Error ? error : new Error(String(error));
  const listeners = runtime[FAILURES];

  if (listeners.length === 0) {
    // No observer registered: escalate to the host's uncaught-error
    // channel so the failure is loud, never swallowed.
    queueMicrotask(() => {
      throw failure;
    });
    return;
  }

  for (const listener of listeners) listener(failure);
};

/** Runtime-scoped API returned by {@link bindRuntime}. */
export interface RuntimeBindings {
  /** Pin a scope alive. Returns an idempotent release function. */
  readonly anchor: (scope: ScopeRef) => () => void;
  /** Pin a scope for the lifetime of the current reactive owner. */
  readonly useAnchor: (scope: ScopeRef) => void;
  /** Reactive accessor for a store view, cell value, or formula result. */
  readonly useValue: <Ref extends AnySpaceRef>(ref: Ref) => () => Snapshot<Ref>;
  /** Untracked read of a ref's current value. */
  readonly peek: <Ref extends AnySpaceRef>(ref: Ref) => Snapshot<Ref>;
  /** Commit facts directly: one call, N facts, one transition. */
  readonly commit: (...facts: [AnyFact, ...AnyFact[]]) => void;
  /** Commit callable for components. Same grammar as `commit`. */
  readonly useCommit: () => (...facts: [AnyFact, ...AnyFact[]]) => void;
  /** Run a saga invocation. Rejects on unhandled failure or scope release. */
  readonly run: <Return>(invocation: SagaInvocation<Return>) => Promise<Return>;
  /** Saga runner callable for components. */
  readonly useRun: <Args extends unknown[], Return>(
    saga: Saga<Args, Return>,
  ) => (...args: Args) => Promise<Return>;
}

/**
 * Bind a runtime and return the full runtime-scoped API. Tests build one
 * per case via {@link createTestRuntime}; app code uses the module-level
 * exports bound to the global runtime.
 */
export const bindRuntime = (runtime: Runtime): RuntimeBindings => ({
  anchor: (scope) => anchorScope(runtime, scope),

  useAnchor(scope) {
    onCleanup(anchorScope(runtime, scope));
  },

  useValue<Ref extends AnySpaceRef>(ref: Ref) {
    return () => resolveValue(runtime, ref) as Snapshot<Ref>;
  },

  peek<Ref extends AnySpaceRef>(ref: Ref) {
    return peekValue(runtime, ref) as Snapshot<Ref>;
  },

  commit: (...facts) => commitFacts(runtime, facts),

  useCommit:
    () =>
    (...facts) =>
      commitFacts(runtime, facts),

  run: (invocation) => runSaga(runtime, invocation),

  useRun<Args extends unknown[], Return>(saga: Saga<Args, Return>) {
    return (...args: Args) => runSaga(runtime, saga(...args));
  },
});

/** Extra observability surface for tests. */
export interface TestRuntime extends RuntimeBindings {
  /** Every commit in order: one entry per transition. */
  readonly ledger: () => ReadonlyArray<readonly AnyFact[]>;
  /** Failures that escaped detached (spawned) sagas. */
  readonly failures: () => readonly Error[];
}

/** Options for {@link createTestRuntime}. */
export interface TestRuntimeOptions {
  /** Capability stubs: `[real, stub]` pairs resolved by identity at call time. */
  readonly calls?: ReadonlyArray<readonly [AnyCapability, AnyCapability]>;
}

/**
 * Build bindings against a fresh isolated runtime with a recording
 * ledger. One call per test keeps state from leaking across cases.
 */
export const createTestRuntime = (
  options: TestRuntimeOptions = {},
): TestRuntime => {
  const runtime = createRuntime();

  for (const [fn, stub] of options.calls ?? []) {
    runtime[STUBS].set(fn, stub);
  }

  const entries: Array<readonly AnyFact[]> = [];
  runtime[OBSERVERS].push((facts) => entries.push(facts));

  const failures: Error[] = [];
  runtime[FAILURES].push((error) => failures.push(error));

  return {
    ...bindRuntime(runtime),
    ledger: () => entries,
    failures: () => failures,
  };
};

/** Helpers bound to the global runtime. */
export const { anchor, useAnchor, useValue, useCommit, peek, run, useRun } =
  bindRuntime(GLOBAL_RUNTIME);
