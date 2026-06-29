import { onConfigMessage, publish } from './channel';
import {
  ENVIRONMENTS,
  type Environment,
  type EnvironmentDefaults,
  type JsonValue,
  type Option,
  type Override,
} from './define-option';
import { deleteOverride, readOverride, writeOverride } from './storage';

/** Layer an override onto an option's defaults — the resolved env map. */
const resolve = <Value extends JsonValue>(
  option: Option<Value>,
  override: Override<Value>,
): EnvironmentDefaults<Value> => ({ ...option.defaults, ...override });

/**
 * Read an option's current configuration: its defaults with any persisted
 * override layered on top, as a full per-environment map. Resolves to the
 * bare defaults where nothing has been written or OPFS is unavailable.
 *
 * Returns every environment's value — selecting the active environment is
 * the caller's concern until environment detection lands.
 */
export const read = async <Value extends JsonValue>(
  option: Option<Value>,
): Promise<EnvironmentDefaults<Value>> =>
  resolve(option, await readOverride<Value>(option.id));

/**
 * Subscribe to an option's changes made in *other* browsing contexts,
 * resolving each to the full env map. Returns an unsubscribe.
 *
 * It does not fire for changes made in this context: a `BroadcastChannel`
 * never delivers a tab its own posts, and we lean on that rather than an
 * in-memory fan-out. A caller mutating via {@link updateConfig} / {@link
 * reset} already has the new override, so it should patch its own state
 * there (resolve it against the option's defaults) instead of waiting on
 * this callback.
 */
export const subscribe = <Value extends JsonValue>(
  option: Option<Value>,
  listener: (config: EnvironmentDefaults<Value>) => void,
): (() => void) =>
  onConfigMessage((message) => {
    if (message.id !== option.id) return;
    listener(resolve(option, message.override as Override<Value>));
  });

/**
 * Merge a per-environment patch into an option's override, persist it to
 * OPFS, and announce it to other tabs. Environments absent from the patch
 * keep their existing value.
 */
export const updateConfig = async <Value extends JsonValue>(
  option: Option<Value>,
  patch: Override<Value>,
): Promise<void> => {
  const next = { ...(await readOverride<Value>(option.id)), ...patch };
  await writeOverride(option.id, next);
  publish({ id: option.id, override: next });
};

/**
 * Clear an option's override for the given environments (all of them by
 * default), reverting each to its default. Persists the result, then
 * announces it like {@link updateConfig}.
 */
export const reset = async <Value extends JsonValue>(
  option: Option<Value>,
  environments: readonly Environment[] = ENVIRONMENTS,
): Promise<void> => {
  const current = await readOverride<Value>(option.id);
  const next: Override<Value> = {};
  for (const env of ENVIRONMENTS) {
    if (!environments.includes(env) && env in current) next[env] = current[env];
  }

  if (Object.keys(next).length === 0) {
    await deleteOverride(option.id);
  } else {
    await writeOverride(option.id, next);
  }

  publish({ id: option.id, override: next });
};
