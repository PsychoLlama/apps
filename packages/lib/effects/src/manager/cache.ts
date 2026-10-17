import type { Task } from '../task';

/**
 * A map keyed by task, then by each input in order. Inputs compare by
 * identity (`Map` semantics), so two calls share a value only when every
 * argument is the very same reference.
 */
export interface Cache<Value> {
  readonly roots: Map<Task, Branch<Value>>;
}

// Implemented as a trie: one `Map` level per input. That's what a composite
// identity key costs in JS — there's no way to hash a tuple by the
// identity of its members.
interface Branch<Value> {
  readonly children: Map<unknown, Branch<Value>>;
  value?: Value;
}

export const createCache = <Value>(): Cache<Value> => ({ roots: new Map() });

const branch = <Value>(): Branch<Value> => ({ children: new Map() });

/** Every branch along the path, root first. Short when the path ends. */
const trace = <Value>(
  cache: Cache<Value>,
  task: Task,
  inputs: readonly unknown[],
) => {
  const path: Branch<Value>[] = [];
  let node = cache.roots.get(task);

  for (const input of inputs) {
    if (!node) break;
    path.push(node);
    node = node.children.get(input);
  }

  if (node) path.push(node);
  return path;
};

/** The value for this exact call, if one is set. */
export const lookup = <Value>(
  cache: Cache<Value>,
  task: Task,
  inputs: readonly unknown[],
): Value | undefined => {
  const path = trace(cache, task, inputs);
  return path.length === inputs.length + 1 ? path.at(-1)?.value : undefined;
};

/** Set the value for this exact call. */
export const insert = <Value>(
  cache: Cache<Value>,
  task: Task,
  inputs: readonly unknown[],
  value: Value,
): void => {
  // Re-setting an existing branch is a no-op, which keeps the
  // get-or-create a single expression per level.
  let node = cache.roots.get(task) ?? branch<Value>();
  cache.roots.set(task, node);

  for (const input of inputs) {
    const child = node.children.get(input) ?? branch<Value>();
    node.children.set(input, child);
    node = child;
  }

  node.value = value;
};

/** Remove the value, pruning any branches left empty. */
export const remove = <Value>(
  cache: Cache<Value>,
  task: Task,
  inputs: readonly unknown[],
): void => {
  const path = trace(cache, task, inputs);
  if (path.length !== inputs.length + 1) return;

  delete path[path.length - 1].value;

  // Unlink empty branches bottom-up.
  for (let depth = path.length - 1; depth > 0; depth -= 1) {
    const node = path[depth];
    if (node.value || node.children.size > 0) return;
    path[depth - 1].children.delete(inputs[depth - 1]);
  }

  const root = path[0];
  if (!root.value && root.children.size === 0) {
    cache.roots.delete(task);
  }
};
