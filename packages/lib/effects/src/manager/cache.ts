import type { FlowNode } from '../flow';

/** An output tuple, compared by identity when it feeds another node. */
export type Tuple = readonly unknown[];

type Kind = FlowNode['kind'];

/** Everything a manager caches. One per manager; operate on it below. */
export interface Cache<Value> {
  /**
   * Values by node kind, node, then input tuple. A node's inputs are one
   * upstream node's output tuple, created once and shared, so the tuple
   * itself is the key: flat levels, with no composite key to build.
   *
   * Keyed by identity (`Map` semantics). Nodes key by their task, or by
   * the flow that built them.
   */
  readonly entries: Readonly<Record<Kind, Map<object, Map<Tuple, Value>>>>;

  /**
   * Task output tuples, interned by value. Equal values share one
   * `[value]` tuple, so downstream keys on it alike, whichever task or
   * input produced it.
   *
   * Keyed by value (`Map` semantics: SameValueZero). Refcounted, since
   * primitives can't be weakly held.
   */
  readonly interned: Map<unknown, { readonly tuple: Tuple; refs: number }>;
}

export const createCache = <Value>(): Cache<Value> => ({
  interned: new Map(),
  entries: {
    task: new Map(),
    join: new Map(),
  },
});

/** The value for this node and input tuple, if one is set. */
export const lookup = <Value>(
  cache: Cache<Value>,
  kind: Kind,
  key: object,
  inputs: Tuple,
): Value | undefined => cache.entries[kind].get(key)?.get(inputs);

/** Set the value for this node and input tuple. */
export const insert = <Value>(
  cache: Cache<Value>,
  kind: Kind,
  key: object,
  inputs: Tuple,
  value: Value,
): void => {
  const byKey = cache.entries[kind];
  const byInputs = byKey.get(key) ?? new Map<Tuple, Value>();
  byKey.set(key, byInputs);
  byInputs.set(inputs, value);
};

/** Remove the value, dropping the node's map once it's empty. */
export const remove = <Value>(
  cache: Cache<Value>,
  kind: Kind,
  key: object,
  inputs: Tuple,
): void => {
  const byKey = cache.entries[kind];
  const byInputs = byKey.get(key);
  if (!byInputs) return;

  byInputs.delete(inputs);
  if (byInputs.size === 0) byKey.delete(key);
};

/** The shared `[value]` tuple, holding a reference on it. */
export const intern = <Value>(cache: Cache<Value>, value: unknown): Tuple => {
  const boxed = cache.interned.get(value) ?? { tuple: [value], refs: 0 };
  cache.interned.set(value, boxed);
  boxed.refs += 1;

  return boxed.tuple;
};

/** Let go of a reference taken by `intern`, freeing the tuple at zero. */
export const drop = <Value>(cache: Cache<Value>, value: unknown): void => {
  const boxed = cache.interned.get(value);
  if (!boxed) return;

  boxed.refs -= 1;
  if (boxed.refs === 0) cache.interned.delete(value);
};
