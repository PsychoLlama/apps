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

// In-memory fan-out for *this* context — we can't lean on BroadcastChannel
// alone. It never echoes to the tab that posted, so the caller of
// `updateConfig` would miss its own change. And one channel multiplexes
// every option, so inbound messages still need routing by ID and resolving
// against each option's defaults. Keyed by option ID; `subscribe` wraps the
// caller's listener so it receives the resolved map, not the raw override.
type OverrideListener = (override: Override<JsonValue>) => void;
const listeners = new Map<string, Set<OverrideListener>>();

// One broadcast subscription backs every local listener. Attached when the
// first listener registers, detached when the last leaves, so an app that
// never subscribes never opens a channel.
let detachChannel: (() => void) | null = null;

const anyListeners = (): boolean => {
  for (const set of listeners.values()) if (set.size > 0) return true;
  return false;
};

const notify = (id: string, override: Override<JsonValue>): void => {
  const set = listeners.get(id);
  if (!set) return;
  for (const listener of set) listener(override);
};

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
 * Subscribe to an option's changes — from this context or a sibling tab.
 * The listener fires on each change (not immediately) with the resolved
 * env map; pair it with {@link read} for the initial value. Returns an
 * unsubscribe.
 */
export const subscribe = <Value extends JsonValue>(
  option: Option<Value>,
  listener: (config: EnvironmentDefaults<Value>) => void,
): (() => void) => {
  const wrapped: OverrideListener = (override) =>
    listener(resolve(option, override as Override<Value>));

  const set = listeners.get(option.id) ?? new Set();
  set.add(wrapped);
  listeners.set(option.id, set);

  detachChannel ??= onConfigMessage(({ id, override }) => notify(id, override));

  return () => {
    set.delete(wrapped);
    if (set.size === 0) listeners.delete(option.id);
    if (!anyListeners()) {
      detachChannel?.();
      detachChannel = null;
    }
  };
};

/**
 * Merge a per-environment patch into an option's override, persist it to
 * OPFS, and announce it to other tabs and local subscribers. Environments
 * absent from the patch keep their existing value.
 */
export const updateConfig = async <Value extends JsonValue>(
  option: Option<Value>,
  patch: Override<Value>,
): Promise<void> => {
  const next = { ...(await readOverride<Value>(option.id)), ...patch };
  await writeOverride(option.id, next);
  publish({ id: option.id, override: next });
  notify(option.id, next);
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
  notify(option.id, next);
};
