import { assert } from '@lib/assert';
import { createSignal, type Signal } from 'solid-js';
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

/** A plan acquired on a manager, and what the manager tracks for it. */
export interface Handle {
  /** Every node in the plan, topologically ordered. */
  readonly nodes: readonly PlanNode[];

  /** The node whose output tuple is the plan's output. */
  readonly output: PlanNode;

  /**
   * Each node's binding, memoized so diamonds resolve once. Absent when an
   * upstream node failed.
   */
  readonly bindings: Map<PlanNode, Promise<Entry | undefined>>;

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

/** The live entry for a key, spawning one if its last life has ended. */
const claim = async (
  manager: Manager,
  node: PlanNode,
  inputs: Tuple,
  sources: readonly Tuple[],
): Promise<Entry> => {
  const { cache } = manager;
  const key = keyOf(node);
  let entry = lookup(cache, node.kind, key, inputs);

  // Never overlap with a previous life of the same key.
  while (entry?.retired) {
    await entry.retired.catch(() => {});
    entry = lookup(cache, node.kind, key, inputs);
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
  return entry;
};

/** Settle the entry, run its cleanup, and free its key. */
const retire = (manager: Manager, entry: Entry): Promise<void> => {
  entry.retired = (async () => {
    try {
      await entry.settled;
      await entry.dispose?.();
    } finally {
      remove(manager.cache, entry.kind, entry.key, entry.inputs);

      // Only after cleanup, so an equal value can't reuse the tuple while
      // anything keyed on it is still tearing down.
      const state = entry.state();
      if (entry.kind === 'task' && state.step === 'succeeded') {
        drop(manager.cache, state.outputs[0]);
      }
    }
  })();

  return entry.retired;
};

const held = (handle: Handle, node: PlanNode) => {
  const signal = handle.held.get(node);
  assert(signal, 'Node is not part of this handle.');

  return signal;
};

/** A bound node's output tuple, or `undefined` if it didn't succeed. */
const outputOf = async (
  manager: Manager,
  handle: Handle,
  node: PlanNode,
): Promise<Tuple | undefined> => {
  const state = (await bind(manager, handle, node))?.state();
  return state?.step === 'succeeded' ? state.outputs : undefined;
};

/** Bind a node once every upstream tuple is known, then let it settle. */
const bind = (
  manager: Manager,
  handle: Handle,
  node: PlanNode,
): Promise<Entry | undefined> => {
  let binding = handle.bindings.get(node);
  if (binding) return binding;

  binding = (async () => {
    // Roots skip the await, so they start in the same tick as `compute`.
    const inputs = node.input
      ? await outputOf(manager, handle, node.input)
      : ROOT;
    if (!inputs) return undefined;

    const sources: Tuple[] = [];
    for (const branch of node.kind === 'join' ? node.branches : []) {
      const outputs = await outputOf(manager, handle, branch);
      if (!outputs) return undefined;
      sources.push(outputs);
    }

    const entry = await claim(manager, node, inputs, sources);
    const [, setEntry] = held(handle, node);
    setEntry(entry);
    await entry.settled;
    return entry;
  })();

  handle.bindings.set(node, binding);
  return binding;
};

/** Forget a node's binding and let go of its entry. Expects it settled. */
const unbind = async (manager: Manager, handle: Handle, node: PlanNode) => {
  if (!handle.bindings.delete(node)) return;

  const [entry, setEntry] = held(handle, node);
  const bound = entry();
  if (!bound) return;

  setEntry(undefined);
  bound.refs -= 1;
  if (bound.refs === 0) await retire(manager, bound);
};

/** Bind the nodes and collect every distinct failure among them. */
const bringUp = async (
  manager: Manager,
  handle: Handle,
  nodes: readonly PlanNode[],
): Promise<unknown[]> => {
  const entries = await Promise.all(
    nodes.map((node) => bind(manager, handle, node)),
  );

  const failures = new Set<unknown>();
  for (const entry of entries) {
    const state = entry?.state();
    if (state?.step === 'failed') failures.add(state.error);
  }

  return [...failures];
};

/** Unbind the nodes downstream first and collect every cleanup failure. */
const tearDown = async (
  manager: Manager,
  handle: Handle,
  nodes: readonly PlanNode[],
): Promise<unknown[]> => {
  // Let in-flight bindings land, or the entries they bind would leak.
  await Promise.all(nodes.flatMap((node) => handle.bindings.get(node) ?? []));

  const failures: unknown[] = [];
  for (const node of nodes.toReversed()) {
    try {
      await unbind(manager, handle, node);
    } catch (error) {
      failures.push(error);
    }
  }

  return failures;
};

/** Build the plan's graph. Pure: nothing runs, and no manager is involved. */
export const acquire = (plan: Plan<[]>): Handle => {
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
 * Run every node, sharing cached work with other handles. Resolves once
 * all nodes settle; rejects with an `AggregateError` of every failure.
 * Safe to call repeatedly.
 */
export const compute = async (
  manager: Manager,
  handle: Handle,
): Promise<void> => {
  assert(!handle.released, 'Handle was already released.');
  manager.handles.add(handle);

  const failures = await bringUp(manager, handle, handle.nodes);
  if (failures.length > 0) {
    throw new AggregateError(failures, 'Plan failed.');
  }
};

/**
 * Drop the handle's references and tear down whatever nothing else
 * holds, downstream first. Rejects with an `AggregateError` if any
 * cleanup throws, after all cleanups have run.
 */
export const release = async (
  manager: Manager,
  handle: Handle,
): Promise<void> => {
  assert(!handle.released, 'Handle was already released.');
  handle.released = true;
  manager.handles.delete(handle);

  const failures = await tearDown(manager, handle, handle.nodes);
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
