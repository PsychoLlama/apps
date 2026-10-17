import { assert } from '@lib/assert';
import { FLOW, type Flow, type FlowNode } from '../flow';
import type { Task } from '../task';
import { createCache, insert, lookup, remove, type Cache } from './cache';
import { spawn, type Entry } from './entry';
import type { NodeState } from './state';

/** A flow acquired on a manager, and what the manager tracks for it. */
export interface Handle {
  /** Every node in the flow, topologically ordered. */
  readonly nodes: readonly FlowNode[];

  /** The nodes forming the flow's output tuple. */
  readonly outputs: readonly FlowNode[];

  /**
   * Each node's binding, memoized so diamonds resolve once. Absent when an
   * upstream node failed.
   */
  readonly bindings: Map<FlowNode, Promise<Entry | undefined>>;

  /** Entries this handle is bound to, and so holds a reference on. */
  readonly held: Map<FlowNode, Entry>;

  released: boolean;
}

/** Computations shared by every handle acquired through it. */
export interface Manager {
  readonly cache: Cache<Entry>;
}

export const createManager = (): Manager => ({ cache: createCache() });

/** The live entry for a key, spawning one if its last life has ended. */
const claim = async (
  manager: Manager,
  task: Task,
  inputs: readonly unknown[],
): Promise<Entry> => {
  let entry = lookup(manager.cache, task, inputs);

  // Never overlap with a previous life of the same key.
  while (entry?.retired) {
    await entry.retired.catch(() => {});
    entry = lookup(manager.cache, task, inputs);
  }

  if (!entry) {
    entry = spawn(task, inputs);
    insert(manager.cache, task, inputs, entry);
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
      remove(manager.cache, entry.task, entry.inputs);
    }
  })();

  return entry.retired;
};

/** Bind a node once every upstream value is known, then let it settle. */
const bind = (
  manager: Manager,
  handle: Handle,
  node: FlowNode,
): Promise<Entry | undefined> => {
  let binding = handle.bindings.get(node);
  if (binding) return binding;

  binding = (async () => {
    const inputs: unknown[] = [];
    for (const input of node.inputs) {
      const upstream = await bind(manager, handle, input);
      if (upstream?.state.step !== 'succeeded') return undefined;
      inputs.push(upstream.state.value);
    }

    const entry = await claim(manager, node.task, inputs);
    handle.held.set(node, entry);
    await entry.settled;
    return entry;
  })();

  handle.bindings.set(node, binding);
  return binding;
};

/** Build the flow's graph. Nothing runs until it's computed. */
export const acquire = (flow: Flow<[]>): Handle => {
  const graph = flow[FLOW]([]);
  return {
    nodes: graph.nodes,
    outputs: graph.outputs,
    bindings: new Map(),
    held: new Map(),
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

  const entries = await Promise.all(
    handle.nodes.map((node) => bind(manager, handle, node)),
  );

  const failures = new Set<unknown>();
  for (const entry of entries) {
    if (entry?.state.step === 'failed') failures.add(entry.state.error);
  }

  if (failures.size > 0) {
    throw new AggregateError([...failures], 'Flow failed.');
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

  // Let in-flight bindings land, or the entries they bind would leak.
  await Promise.all(handle.bindings.values());

  const failures: unknown[] = [];
  for (const node of handle.nodes.toReversed()) {
    const entry = handle.held.get(node);
    if (!entry) continue;

    entry.refs -= 1;
    if (entry.refs > 0) continue;

    try {
      await retire(manager, entry);
    } catch (error) {
      failures.push(error);
    }
  }

  if (failures.length > 0) {
    throw new AggregateError(failures, 'Cleanup failed.');
  }
};

/** The current state of one of the handle's nodes. */
export const inspect = (handle: Handle, node: FlowNode): NodeState =>
  handle.held.get(node)?.state ?? { step: 'pending' };
