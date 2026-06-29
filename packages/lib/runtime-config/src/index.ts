/**
 * Runtime configuration — feature flags and other values resolved at
 * runtime rather than build time.
 *
 * Options are declared with {@link defineOption}, read with {@link
 * readEnvironment} (or {@link readAllEnvironments} for the full map),
 * watched with {@link subscribe}, and changed with {@link updateConfig} /
 * {@link reset}. Overrides persist to OPFS and fan out across tabs over a
 * broadcast channel.
 */

export {
  defineOption,
  type Environment,
  type EnvironmentDefaults,
  type JsonValue,
  type Option,
  type Override,
} from './define-option';
export {
  readAllEnvironments,
  readEnvironment,
  reset,
  subscribe,
  updateConfig,
} from './config';
export { environment } from './environment';
