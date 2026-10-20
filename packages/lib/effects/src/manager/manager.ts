import { assert } from '@lib/assert';
import { createSignal, untrack, type Signal } from 'solid-js';
import {
  all,
  chain,
  from,
  lastly,
  later,
  now,
  rescue,
  sequence,
  toPromise,
  type Eventual,
} from '../eventual';
import type { Mode } from '../mode';
import { PLAN, type Plan, type PlanNode } from '../plan';
import {
  createCache,
  drop,
  insert,
  intern,
  lookup,
  remove,
  type Cache,
  type Tuple,
} from './cache';
import { keyOf, ROOT, spawn, type Entry } from './entry';
import type * as Node from './node';

/** Phantom slot pinning a handle's output tuple and mode. */
declare const SIGNATURE: unique symbol;

/** A plan acquired on a manager, and what the manager tracks for it. */
export interface Handle<
  out Outputs extends readonly unknown[] = readonly unknown[],
  out M extends Mode = Mode,
> {
  readonly [SIGNATURE]?: { readonly outputs: Outputs; readonly mode: M };

  /** Every node in the plan, topologically ordered. */
  readonly nodes: readonly PlanNode[];

  /** The node whose output tuple is the plan's output. */
  readonly output: PlanNode;

  /**
   * Each node's binding, memoized so diamonds resolve once. Absent when an
   * upstream node failed. A binding that had to wait is swapped for its
   * value once it lands, so computing again doesn't.
   */
  readonly bindings: Map<PlanNode, Eventual<Entry | undefined>>;

  /** Per node, the entry it's bound to and so holds a reference on. */
  readonly held: ReadonlyMap<PlanNode, Signal<Entry | undefined>>;

  released: boolean;
}

/** Computations shared by every handle acquired through it. */
export interface Manager {
  /** Entries and interned output tuples. The manager alone operates on it. */
  readonly cache: Cache<Entry>;

  /** Handles that have computed and not yet been released. */
  readonly handles: Set<Handle>;
}

export const createManager = (): Manager => ({
  cache: createCache(),
  handles: new Set(),
});

const same = (left: readonly Tuple[], right: readonly Tuple[]) =>
  left.length === right.length &&
  left.every((tuple, index) => tuple === right[index]);

/** The entry once it settles. Waits only if it's still computing. */
const settled = (entry: Entry): Eventual<Entry> =>
  entry.state().step === 'computing'
    ? later(entry.settled.then(() => entry))
    : now(entry);

/** The live entry for a key, spawning one if its last life has ended. */
const claim = (
  manager: Manager,
  node: PlanNode,
  inputs: Tuple,
  sources: readonly Tuple[],
): Eventual<Entry> => {
  const { cache } = manager;
  const key = keyOf(node);
  let entry = lookup(cache, node.kind, key, inputs);

  // Never overlap with a previous life of the same key. Only a life that
  // had to wait to retire is still here.
  if (entry?.retired) {
    return later(
      entry.retired
        .catch(() => {})
        .then(() => toPromise(claim(manager, node, inputs, sources))),
    );
  }

  if (!entry) {
    entry = spawn(node, inputs, sources, (value) => intern(cache, value));
    insert(cache, node.kind, key, inputs, entry);
  }

  // A join's output is only as stable as its branches. Whoever holds a
  // join holds its branches too, so they can't be recomputed while it
  // lives, and every claimant arrives with the same tuples.
  assert(same(entry.sources, sources), 'Join claimed with stale branches.');

  entry.refs += 1;
  return now(entry);
};

/** Settle the entry, run its cleanup, and free its key. */
const retire = (manager: Manager, entry: Entry): Eventual<unknown> => {
  const retired = lastly(
    () => chain(settled(entry), () => from(entry.dispose?.())),
    () => {
      remove(manager.cache, entry.kind, entry.key, entry.inputs);

      // Only after cleanup, so an equal value can't reuse the tuple while
      // anything keyed on it is still tearing down.
      const state = entry.state();
      if (entry.kind === 'task' && state.step === 'succeeded') {
        drop(manager.cache, state.outputs[0]);
      }
    },
  );

  if (retired.type === 'async') entry.retired = retired.value;
  return retired;
};

const held = (handle: Handle, node: PlanNode) => {
  const signal = handle.held.get(node);
  assert(signal, 'Node is not part of this handle.');

  return signal;
};

/** A bound node's output tuple, or `undefined` if it didn't succeed. */
const outputOf = (
  manager: Manager,
  handle: Handle,
  node: PlanNode,
): Eventual<Tuple | undefined> =>
  chain(bind(manager, handle, node), (entry) => {
    const state = entry?.state();
    return now(state?.step === 'succeeded' ? state.outputs : undefined);
  });

/** Claim the node's entry once its branches are known, and hold it. */
const attach = (
  manager: Manager,
  handle: Handle,
  node: PlanNode,
  inputs: Tuple,
): Eventual<Entry | undefined> => {
  const branches = node.kind === 'join' ? node.branches : [];
  const sources = all(
    branches.map((branch) => outputOf(manager, handle, branch)),
  );

  return chain(sources, (sources) => {
    if (!sources.every(Boolean)) return now(undefined);

    const claimed = claim(manager, node, inputs, sources as Tuple[]);
    return chain(claimed, (entry) => {
      const [, setEntry] = held(handle, node);
      setEntry(entry);
      return settled(entry);
    });
  });
};

/** Bind a node once every upstream tuple is known, then let it settle. */
const bind = (
  manager: Manager,
  handle: Handle,
  node: PlanNode,
): Eventual<Entry | undefined> => {
  const bound = handle.bindings.get(node);
  if (bound) return bound;

  const inputs = node.input ? outputOf(manager, handle, node.input) : now(ROOT);
  const binding = chain(inputs, (inputs) =>
    inputs ? attach(manager, handle, node, inputs) : now(undefined),
  );

  handle.bindings.set(node, binding);
  if (binding.type === 'async') {
    binding.value.then(
      (entry) => {
        // Unless it was unbound meanwhile.
        if (handle.bindings.get(node) === binding) {
          handle.bindings.set(node, now(entry));
        }
      },
      () => {},
    );
  }

  return binding;
};

/** Forget a node's binding and let go of its entry. Expects it settled. */
const unbind = (
  manager: Manager,
  handle: Handle,
  node: PlanNode,
): Eventual<unknown> => {
  if (!handle.bindings.delete(node)) return now(undefined);

  const [entry, setEntry] = held(handle, node);
  const bound = entry();
  if (!bound) return now(undefined);

  setEntry(undefined);
  bound.refs -= 1;
  return bound.refs === 0 ? retire(manager, bound) : now(undefined);
};

/** Bind the nodes and collect every distinct failure among them. */
const bringUp = (
  manager: Manager,
  handle: Handle,
  nodes: readonly PlanNode[],
): Eventual<unknown[]> =>
  chain(all(nodes.map((node) => bind(manager, handle, node))), (entries) => {
    const failures = new Set<unknown>();
    for (const entry of entries) {
      const state = entry?.state();
      if (state?.step === 'failed') failures.add(state.error);
    }

    return now([...failures]);
  });

/** Unbind the nodes downstream first and collect every cleanup failure. */
const tearDown = (
  manager: Manager,
  handle: Handle,
  nodes: readonly PlanNode[],
): Eventual<unknown[]> => {
  // Let in-flight bindings land, or the entries they bind would leak.
  const inFlight = all(
    nodes.flatMap((node) => handle.bindings.get(node) ?? []),
  );

  return chain(inFlight, () => {
    const failures: unknown[] = [];
    const unbound = sequence(nodes.toReversed(), (node) =>
      rescue(
        () => unbind(manager, handle, node),
        (error) => failures.push(error),
      ),
    );

    return chain(unbound, () => now(failures));
  });
};

/** Build the plan's graph. Pure: nothing runs, and no manager is involved. */
export const acquire = <Outputs extends readonly unknown[], M extends Mode>(
  plan: Plan<[], Outputs, M>,
): Handle<Outputs, M> => {
  const graph = plan[PLAN]();
  return {
    nodes: graph.nodes,
    output: graph.output,
    bindings: new Map(),
    held: new Map(
      graph.nodes.map((node) => [
        node,
        // eslint-disable-next-line solid/reactivity -- Stored whole.
        createSignal<Entry | undefined>(),
      ]),
    ),
    released: false,
  };
};

/**
 * Run every node, sharing cached work with other handles, and return the
 * plan's raw output tuple. It's here right away unless a node has to
 * wait: a `sync` plan's always is, and so is any plan's once it has
 * settled. Fails with an `AggregateError` of every failure, thrown now or
 * rejected later. Safe to call repeatedly.
 */
export const compute = <Outputs extends readonly unknown[], M extends Mode>(
  manager: Manager,
  handle: Handle<Outputs, M>,
): Eventual<Outputs, M> =>
  // Bindings call this from render. Nothing it reads is a dependency.
  untrack(() => {
    assert(!handle.released, 'Handle was already released.');
    manager.handles.add(handle);

    const failures = bringUp(manager, handle, handle.nodes);
    const outputs = chain(failures, (failures) => {
      if (failures.length > 0) {
        throw new AggregateError(failures, 'Plan failed.');
      }

      // Its outputs may already be disposed.
      assert(!handle.released, 'Handle was released while computing.');

      const state = inspect(handle, handle.output);
      assert(state.step === 'succeeded', 'Plan computed without an output.');
      return now(state.outputs);
    });

    // The graph is untyped at runtime; the plan's signature vouches, and
    // a `sync` plan never waits.
    return outputs as Eventual<Outputs, M>;
  });

/**
 * Drop the handle's references and tear down whatever nothing else
 * holds, downstream first. Whatever doesn't wait is torn down before
 * this returns, all of a `sync` plan included. Rejects with an
 * `AggregateError` if any cleanup throws, after all cleanups have run.
 */
export const release = async (
  manager: Manager,
  handle: Handle,
): Promise<void> => {
  assert(!handle.released, 'Handle was already released.');
  handle.released = true;
  manager.handles.delete(handle);

  // No awaits before this, so the synchronous part runs in this call.
  const torn = untrack(() => tearDown(manager, handle, handle.nodes));
  const failures = await toPromise(torn);

  if (failures.length > 0) {
    throw new AggregateError(failures, 'Cleanup failed.');
  }
};

/**
 * The current state of one of the handle's nodes. Reactive: tracks under
 * a Solid computation, reads plainly outside one.
 */
export const inspect = (handle: Handle, node: PlanNode): Node.State => {
  const [entry] = held(handle, node);
  return entry()?.state() ?? { step: 'pending' };
};
