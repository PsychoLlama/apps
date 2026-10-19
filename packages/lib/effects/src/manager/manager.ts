import { assert } from '@lib/assert';
import { createSignal, type Accessor, type Signal } from 'solid-js';
import { FLOW, type Flow, type FlowNode } from '../flow';
import { createCache, insert, lookup, remove, type Cache } from './cache';
import { keyOf, ROOT, spawn, type Entry, type Tuple } from './entry';
import type * as Node from './node';

/** A flow acquired on a manager, and what the manager tracks for it. */
export interface Handle {
  /** Every node in the flow, topologically ordered. */
  readonly nodes: readonly FlowNode[];

  /** The node whose output tuple is the flow's output. */
  readonly output: FlowNode;

  /**
   * Each node's binding, memoized so diamonds resolve once. Absent when an
   * upstream node failed.
   */
  readonly bindings: Map<FlowNode, Promise<Entry | undefined>>;

  /** Per node, the entry it's bound to and so holds a reference on. */
  readonly held: ReadonlyMap<FlowNode, Signal<Entry | undefined>>;

  released: boolean;
}

/** Computations shared by every handle acquired through it. */
export interface Manager {
  readonly cache: Cache<Entry>;

  /** Handles that have computed and not yet been released. */
  readonly handles: Set<Handle>;
}

export const createManager = (): Manager => ({
  cache: createCache(),
  handles: new Set(),
});

/** The live entry for a key, spawning one if its last life has ended. */
const claim = async (
  manager: Manager,
  node: FlowNode,
  sources: readonly Tuple[],
): Promise<Entry> => {
  const key = keyOf(node);
  let entry = lookup(manager.cache, key, sources);

  // Never overlap with a previous life of the same key.
  while (entry?.retired) {
    await entry.retired.catch(() => {});
    entry = lookup(manager.cache, key, sources);
  }

  if (!entry) {
    entry = spawn(node, sources);
    insert(manager.cache, key, sources, entry);
  }

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
      remove(manager.cache, entry.key, entry.sources);
    }
  })();

  return entry.retired;
};

const held = (handle: Handle, node: FlowNode) => {
  const signal = handle.held.get(node);
  assert(signal, 'Node is not part of this handle.');

  return signal;
};

/** The nodes whose output tuples feed this one. */
const upstream = (node: FlowNode): readonly FlowNode[] => {
  if (node.kind === 'join') return node.branches;
  return node.input ? [node.input] : [];
};

/** Bind a node once every upstream tuple is known, then let it settle. */
const bind = (
  manager: Manager,
  handle: Handle,
  node: FlowNode,
): Promise<Entry | undefined> => {
  let binding = handle.bindings.get(node);
  if (binding) return binding;

  binding = (async () => {
    const sources: Tuple[] = [];
    for (const source of upstream(node)) {
      const entry = await bind(manager, handle, source);
      const state = entry?.state();
      if (state?.step !== 'succeeded') return undefined;
      sources.push(state.outputs);
    }

    // A root task still keys on a tuple, so every node keys the same way.
    if (node.kind === 'task' && !node.input) sources.push(ROOT);

    const entry = await claim(manager, node, sources);
    const [, setEntry] = held(handle, node);
    setEntry(entry);
    await entry.settled;
    return entry;
  })();

  handle.bindings.set(node, binding);
  return binding;
};

/** Forget a node's binding and let go of its entry. Expects it settled. */
const unbind = async (manager: Manager, handle: Handle, node: FlowNode) => {
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
  nodes: readonly FlowNode[],
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
  nodes: readonly FlowNode[],
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

/** Build the flow's graph. Pure: nothing runs, and no manager is involved. */
export const acquire = (flow: Flow<[]>): Handle => {
  const graph = flow[FLOW]();
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
    throw new AggregateError(failures, 'Flow failed.');
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
 * The entry one of the handle's nodes is bound to, or `undefined` while
 * the node is pending. Reactive: tracks under a Solid computation, reads
 * plainly outside one.
 */
export const bound = (
  handle: Handle,
  node: FlowNode,
): Accessor<Entry | undefined> => {
  const [entry] = held(handle, node);
  return entry;
};

/** The current state of one of the handle's nodes. Reactive, as `bound`. */
export const inspect = (handle: Handle, node: FlowNode): Node.State =>
  bound(handle, node)()?.state() ?? { step: 'pending' };
