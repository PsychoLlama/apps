import { untrack } from 'solid-js';
import { abortError } from './abort';
import {
  DROP,
  KIND,
  SCOPES,
  type Runtime,
  type ScopeInstance,
  type ScopeRef,
} from './internal';

export type { ScopeRef };

/**
 * Define a scope — the unit of ownership and lifetime. A scope owns
 * stores, cells, and running sagas. It holds no state until anchored;
 * nothing it owns outlives its last anchor.
 */
export const defineScope = (): ScopeRef => ({ [KIND]: 'scope' });

/** Resolve a live scope instance. Throws if the scope has no anchors. */
export const getAliveScope = (
  runtime: Runtime,
  scope: ScopeRef,
): ScopeInstance => {
  const instance = runtime[SCOPES].get(scope);
  if (!instance) {
    throw new Error(
      'Dead scope: anchor it before reading, committing, or running sagas',
    );
  }
  return instance;
};

/**
 * Pin a scope alive. Anchors are refcounted: the first anchor materializes
 * the scope; releasing the last one kills it — aborting its sagas,
 * running cell drop hooks, and deallocating its space. The returned
 * release function is idempotent.
 */
export const anchorScope = (
  runtime: Runtime,
  scope: ScopeRef,
): (() => void) => {
  let instance = runtime[SCOPES].get(scope);

  if (!instance) {
    instance = {
      anchors: 0,
      controller: new AbortController(),
      spaces: new Map(),
    };
    runtime[SCOPES].set(scope, instance);
  }

  instance.anchors += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    instance.anchors -= 1;
    if (instance.anchors === 0) killScope(runtime, scope, instance);
  };
};

const killScope = (
  runtime: Runtime,
  scope: ScopeRef,
  instance: ScopeInstance,
): void => {
  // Delete first so reads and commits observe the death immediately, then
  // abort producers, then release owned resources.
  runtime[SCOPES].delete(scope);
  instance.controller.abort(abortError());

  for (const [ref, space] of instance.spaces) {
    if (ref[KIND] === 'cell' && space.kind === 'cell') {
      ref[DROP]?.(untrack(() => space.box.current) as never);
    }
  }
};
