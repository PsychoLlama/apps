/** An output tuple, compared by identity when it feeds another node. */
export type Tuple = readonly unknown[];

/**
 * Values by node, then by input tuple. A node's inputs are one upstream
 * node's output tuple, created once and shared, so the tuple itself is
 * the key: two flat levels, with no composite key to build.
 *
 * Keyed by identity (`Map` semantics). Nodes key by their task, or by the
 * flow that built them.
 */
export type Cache<Value> = Map<object, Map<Tuple, Value>>;

export const createCache = <Value>(): Cache<Value> => new Map();

/** The value for this node and input tuple, if one is set. */
export const lookup = <Value>(
  cache: Cache<Value>,
  key: object,
  inputs: Tuple,
): Value | undefined => cache.get(key)?.get(inputs);

/** Set the value for this node and input tuple. */
export const insert = <Value>(
  cache: Cache<Value>,
  key: object,
  inputs: Tuple,
  value: Value,
): void => {
  const byInputs = cache.get(key) ?? new Map<Tuple, Value>();
  cache.set(key, byInputs);
  byInputs.set(inputs, value);
};

/** Remove the value, dropping the node's map once it's empty. */
export const remove = <Value>(
  cache: Cache<Value>,
  key: object,
  inputs: Tuple,
): void => {
  const byInputs = cache.get(key);
  if (!byInputs) return;

  byInputs.delete(inputs);
  if (byInputs.size === 0) cache.delete(key);
};
