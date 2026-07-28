import { FAILURES, OBSERVERS, SCOPES, STUBS, type Runtime } from './internal';

export type { Runtime };

/** Create an isolated runtime. Tests build their own; app code uses the global. */
export const createRuntime = (): Runtime => ({
  [SCOPES]: new Map(),
  [OBSERVERS]: [],
  [FAILURES]: [],
  [STUBS]: new Map(),
});

/** Default runtime used by app code. */
export const GLOBAL_RUNTIME: Runtime = createRuntime();
