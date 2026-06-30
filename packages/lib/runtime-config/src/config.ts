import { onConfigMessage, publish } from './channel';
import {
  ENVIRONMENTS,
  type Environment,
  type EnvironmentDefaults,
  type JsonValue,
  type Option,
  type Override,
} from './define-config';
import { environment } from './environment';
import { deleteOverride, readOverride, writeOverride } from './storage';

/** Layer an override onto an option's defaults — the resolved env map. */
const resolve = <Value extends JsonValue>(
  option: Option<Value>,
  override: Override<Value>,
): EnvironmentDefaults<Value> => ({ ...option.defaults, ...override });

/**
 * Serialize a JSON value to a canonical string. The replacer rewrites every
 * object with its keys sorted, so `JSON.stringify` — which otherwise emits
 * keys in insertion order — produces identical text for structurally equal
 * values. `JSON.stringify` still handles the recursion, arrays, and escaping;
 * we only normalize key order. Its quoting and brackets keep types apart (a
 * string can't collide with the array or object that spells it), so a plain
 * `===` on the result is a sound deep equality.
 */
const canonical = (value: JsonValue): string =>
  JSON.stringify(value, (_key, val: JsonValue) =>
    val !== null && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(
          Object.entries(val as { [key: string]: JsonValue }).sort(
            ([keyA], [keyB]) => (keyA > keyB ? 1 : -1),
          ),
        )
      : val,
  );

/** Deep equality for two JSON values, order-insensitive on object keys. */
const jsonEqual = (left: JsonValue, right: JsonValue): boolean =>
  canonical(left) === canonical(right);

/**
 * Whether an override is redundant: every environment it names already holds
 * the option's default. Such an override remembers nothing, so it's deleted
 * rather than persisted. An empty override is trivially redundant.
 */
const isRedundant = <Value extends JsonValue>(
  option: Option<Value>,
  override: Override<Value>,
): boolean =>
  ENVIRONMENTS.every((env) => {
    const value = override[env];
    return value === undefined || jsonEqual(value, option.defaults[env]);
  });

/**
 * Persist an option's resolved override and announce it to every context.
 * Deletes the file when the override is {@link isRedundant} — nothing worth
 * remembering — otherwise writes it. Either way the change fans out.
 */
const commit = async <Value extends JsonValue>(
  option: Option<Value>,
  override: Override<Value>,
): Promise<void> => {
  if (isRedundant(option, override)) {
    await deleteOverride(option.id);
  } else {
    await writeOverride(option.id, override);
  }
  publish(option.id, override);
};

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
 * Subscribe to an option's changes, reporting its resolved value for the
 * current {@link environment}. Returns an unsubscribe.
 *
 * Fires for changes from *any* context — sibling tabs and this one. A caller
 * mutating via {@link updateConfig} / {@link reset} hears its own write back
 * here too, so it can drive all of its state off this callback rather than
 * also patching by hand at the mutation site.
 */
export const subscribe = <Value extends JsonValue>(
  option: Option<Value>,
  listener: (value: Value) => void,
): (() => void) =>
  onConfigMessage(option.id, (override) => {
    listener(resolve(option, override as Override<Value>)[environment]);
  });

/**
 * Merge a per-environment patch into an option's override, persist it to
 * OPFS, and announce it to other tabs. Environments absent from the patch
 * keep their existing value. When the merge leaves every environment back at
 * its default, the file is deleted rather than written — a no-op override
 * isn't worth persisting.
 */
export const updateConfig = async <Value extends JsonValue>(
  option: Option<Value>,
  patch: Override<Value>,
): Promise<void> => {
  const next = { ...(await readOverride<Value>(option.id)), ...patch };
  await commit(option, next);
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

  await commit(option, next);
};
