import type { PlanNode } from '../plan';

/** An output tuple, as node states report it. */
export type Tuple = readonly unknown[];

type Kind = PlanNode['kind'];

/** Everything a manager caches. One per manager; operate on it below. */
export interface Cache<Value> {
  /**
   * Values by node kind, node, then input. A node's input is one upstream
   * node's output, so the value itself is the key: flat levels, with no
   * composite key to build.
   *
   * Keyed by value (`Map` semantics: SameValueZero). Equal outputs share
   * downstream work, whichever node or input produced them. Nodes key by
   * their task, or by the plan that built them.
   */
  readonly entries: Readonly<Record<Kind, Map<object, Map<unknown, Value>>>>;
}

export const createCache = <Value>(): Cache<Value> => ({
  entries: {
    task: new Map(),
    join: new Map(),
  },
});

/** The value for this node and input, if one is set. */
export const lookup = <Value>(
  cache: Cache<Value>,
  kind: Kind,
  key: object,
  input: unknown,
): Value | undefined => cache.entries[kind].get(key)?.get(input);

/** Set the value for this node and input. */
export const insert = <Value>(
  cache: Cache<Value>,
  kind: Kind,
  key: object,
  input: unknown,
  value: Value,
): void => {
  const byKey = cache.entries[kind];
  const byInput = byKey.get(key) ?? new Map<unknown, Value>();
  byKey.set(key, byInput);
  byInput.set(input, value);
};

/** Remove the value, dropping the node's map once it's empty. */
export const remove = <Value>(
  cache: Cache<Value>,
  kind: Kind,
  key: object,
  input: unknown,
): void => {
  const byKey = cache.entries[kind];
  const byInput = byKey.get(key);
  if (!byInput) return;

  byInput.delete(input);
  if (byInput.size === 0) byKey.delete(key);
};
