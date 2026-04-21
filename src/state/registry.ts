import { ENTRIES, type Registry } from './internal';

/** Create an isolated registry. Tests should use per-test registries. */
export function createRegistry(): Registry {
  return { [ENTRIES]: new Map() };
}

/** Default registry used by app code. */
export const GLOBAL_REGISTRY: Registry = createRegistry();

export type { Registry };
