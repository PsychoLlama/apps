import { onConfigMessage, publish } from './channel';
import {
  ENVIRONMENTS,
  type Environment,
  type EnvironmentDefaults,
  type JsonValue,
  type Option,
  type Override,
} from './define-option';
import { environment } from './environment';
import { deleteOverride, readOverride, writeOverride } from './storage';

/** Layer an override onto an option's defaults — the resolved env map. */
const resolve = <Value extends JsonValue>(
  option: Option<Value>,
  override: Override<Value>,
): EnvironmentDefaults<Value> => ({ ...option.defaults, ...override });

/**
 * Read an option across *every* environment: its defaults with any
 * persisted override layered on top, as a full per-environment map.
 * Resolves to the bare defaults where nothing has been written or OPFS is
 * unavailable.
 *
 * Reach for this when you need the whole map at once — e.g. a settings UI
 * that edits each environment. To read the value for one environment, use
 * {@link readEnvironment}.
 */
export const readAllEnvironments = async <Value extends JsonValue>(
  option: Option<Value>,
): Promise<EnvironmentDefaults<Value>> =>
  resolve(option, await readOverride<Value>(option.id));

/**
 * Read an option's resolved value for a single environment — the current
 * {@link environment} by default. Layers any persisted override on top of
 * the defaults, so this reflects runtime changes (it reads from OPFS).
 *
 * This is the everyday read: "what is this option set to here, now?".
 */
export const readEnvironment = async <Value extends JsonValue>(
  option: Option<Value>,
  env: Environment = environment,
): Promise<Value> => (await readAllEnvironments(option))[env];

/**
 * The option's *default* value for a single environment — the current
 * {@link environment} by default. Synchronous: it ignores OPFS overrides
 * and reads straight off the option declaration.
 *
 * Reach for this in contexts that can't await a disk read or that
 * deliberately want the shipped default rather than the live value (e.g.
 * SSR, or a synchronous module-init guard). Where overrides matter, use
 * {@link readEnvironment}.
 */
export const readEnvironmentDefault = <Value extends JsonValue>(
  option: Option<Value>,
  env: Environment = environment,
): Value => option.defaults[env];

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
