/**
 * Runtime configuration — feature flags and other values resolved at
 * runtime rather than build time.
 *
 * Options are declared with {@link defineConfig}, read with {@link
 * readEnvironment} (or {@link readAllEnvironments} for the full map),
 * watched with {@link subscribe}, and changed with {@link updateConfig} /
 * {@link reset}. Overrides persist to OPFS and fan out across tabs over a
 * broadcast channel.
 *
 * {@link watchAll} is the streaming counterpart to {@link subscribe}:
 * several options merged into one buffered async stream, for consumers
 * that would rather drain changes than register callbacks.
 *
 * {@link pruneOverrides} is the housekeeping call: hand it every option the
 * origin declares and it clears the persisted remains of options that no
 * longer exist.
 */

export {
  defineConfig,
  type Environment,
  type EnvironmentDefaults,
  type JsonValue,
  type Option,
  type Override,
} from './define-config';
export {
  readAllEnvironments,
  readEnvironment,
  reset,
  subscribe,
  updateConfig,
} from './config';
export { environment } from './environment';
export { pruneOverrides } from './storage';
export { watchAll } from './watch';
