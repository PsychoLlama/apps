import { assert } from '@lib/assert';
import { createSignal, type Accessor, type Signal } from 'solid-js';
import { FLOW, type Flow, type FlowNode } from '../flow';
import { isSourceTask, SOURCE, type Source, type SourceTask } from '../source';
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

  /** Per node, the entry it's bound to and so holds a reference on. */
  readonly held: ReadonlyMap<FlowNode, Signal<Entry | undefined>>;

  /** Serializes the jobs that rebind nodes: source changes and release. */
  queue: Promise<unknown>;

  released: boolean;
}

/** Computations shared by every handle acquired through it. */
export interface Manager {
  readonly cache: Cache<Entry>;

  /** Each source's current value, once set. Unset sources read their initial. */
  readonly sources: Map<Task, unknown>;

  /** Handles that have computed, so a source change can reach their nodes. */
  readonly handles: Set<Handle>;
}

export const createManager = (): Manager => ({
  cache: createCache(),
  sources: new Map(),
  handles: new Set(),
});

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

const held = (handle: Handle, node: FlowNode) => {
  const signal = handle.held.get(node);
  assert(signal, 'Node is not part of this handle.');

  return signal;
};

const current = (manager: Manager, task: SourceTask<unknown>) =>
  manager.sources.has(task) ? manager.sources.get(task) : task[SOURCE];

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
    if (isSourceTask(node.task)) {
      inputs.push(current(manager, node.task));
    }

    for (const input of node.inputs) {
      const upstream = await bind(manager, handle, input);
      const state = upstream?.state();
      if (state?.step !== 'succeeded') return undefined;
      inputs.push(state.value);
    }

    const entry = await claim(manager, node.task, inputs);
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

/** The nodes reading a source task, and everything downstream of them. */
const dependents = (handle: Handle, task: Task): FlowNode[] => {
  const affected = new Set<FlowNode>();
  for (const node of handle.nodes) {
    if (
      node.task === task ||
      node.inputs.some((input) => affected.has(input))
    ) {
      affected.add(node);
    }
  }

  return [...affected];
};

/** Run the job after every job queued on the handle before it. */
const enqueue = <Result>(handle: Handle, job: () => Promise<Result>) => {
  const run = handle.queue.then(job);
  handle.queue = run.catch(() => {});
  return run;
};

/** Build the flow's graph. Pure: nothing runs, and no manager is involved. */
export const acquire = (flow: Flow<[]>): Handle => {
  const graph = flow[FLOW]([]);
  return {
    nodes: graph.nodes,
    outputs: graph.outputs,
    bindings: new Map(),
    held: new Map(
      graph.nodes.map((node) => [
        node,
        // eslint-disable-next-line solid/reactivity -- Stored whole.
        createSignal<Entry | undefined>(),
      ]),
    ),
    queue: Promise.resolve(),
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

  await enqueue(handle, async () => {
    const failures = await tearDown(manager, handle, handle.nodes);
    if (failures.length > 0) {
      throw new AggregateError(failures, 'Cleanup failed.');
    }
  });
};

/**
 * Change a source's value. Every node downstream of it, in every live
 * handle, lets go of its entry (downstream first) and binds again against
 * the new value. Resolves once they all settle; rejects with an
 * `AggregateError` of every cleanup and compute failure.
 */
export const setSource = async <Value>(
  manager: Manager,
  src: Source<Value>,
  value: Value,
): Promise<void> => {
  const task = src[SOURCE];
  if (Object.is(current(manager, task), value)) return;
  manager.sources.set(task, value);

  const refreshed = await Promise.all(
    [...manager.handles].map((handle) =>
      enqueue(handle, async () => {
        // A later change supersedes this one; its job will do the work.
        if (!Object.is(current(manager, task), value)) return [];

        const nodes = dependents(handle, task);
        if (handle.released || nodes.length === 0) return [];

        return [
          ...(await tearDown(manager, handle, nodes)),
          ...(await bringUp(manager, handle, nodes)),
        ];
      }),
    ),
  );

  const failures = refreshed.flat();
  if (failures.length > 0) {
    throw new AggregateError(failures, 'Source change failed.');
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
export const inspect = (handle: Handle, node: FlowNode): NodeState =>
  bound(handle, node)()?.state() ?? { step: 'pending' };
