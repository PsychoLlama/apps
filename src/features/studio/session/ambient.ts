/**
 * Cycle-free accessor for the module-level session store singleton.
 *
 * Activities need to read/write the reactive session state, but they
 * are imported transitively by the store (store → workflows →
 * activities). A direct `import { session } from './store'` creates
 * an unresolvable module cycle at test/build time. This file has no
 * runtime imports, so activities can depend on it safely. The store
 * calls `registerSession` once its singleton is created.
 */

import type { SessionState } from './store';

let ambient: SessionState | null = null;

export function registerSession(state: SessionState): void {
  ambient = state;
}

export function useSession(): SessionState {
  if (ambient === null) {
    throw new Error('Session singleton not registered');
  }
  return ambient;
}
