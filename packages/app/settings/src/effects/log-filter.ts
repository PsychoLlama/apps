import { createSignal } from 'solid-js';
import { pipe, reactive, type Reactive } from '@lib/effects';
import {
  environment,
  getDefaultValue,
  type JsonValue,
  type Option,
  readEnvironment,
  reset,
  subscribe,
  updateConfig,
} from '@lib/runtime-config';
import { filter } from '@lib/observability/config';

/** The active environment's built-in log filter: what a reset reverts to. */
export const defaultLogFilter = getDefaultValue(filter).pattern;

// Subscribes before reading. A change landing mid-read is at least as
// fresh as the read, so the read only lands if nothing changed. The
// default never shows: the task resolves after the read.
const observeOption = async <Value extends JsonValue>(
  option: Option<Value>,
): Promise<Reactive<Value>> => {
  const [value, setValue] = createSignal(getDefaultValue(option));
  const unsubscribe = subscribe(option, setValue);

  let stale = false;
  const stopStaleWatcher = subscribe(option, () => (stale = true));

  try {
    const read = await readEnvironment(option);
    if (!stale) setValue(() => read);
  } catch (error) {
    unsubscribe();
    throw error;
  } finally {
    stopStaleWatcher();
  }

  return reactive(value, unsubscribe);
};

/**
 * The console log filter for the active environment as a live accessor,
 * with any persisted OPFS override layered over the default. Changes from
 * any browsing context land here, this tab's own writes included.
 * Releasing the plan drops the subscription.
 */
export const $logFilter = pipe([() => observeOption(filter)]);

/**
 * Persist a new log filter pattern as the active environment's override.
 * The write echoes back through the subscription `$logFilter` holds.
 */
export const $updateFilter = pipe([
  () =>
    (pattern: string): Promise<void> =>
      updateConfig(filter, { [environment]: { pattern } }),
]);

/**
 * Clear the log filter override for the active environment only, reverting
 * it to the built-in default. Other environments keep their overrides. The
 * reset echoes back through the subscription `$logFilter` holds.
 */
export const $resetFilter = pipe([
  () => (): Promise<void> => reset(filter, [environment]),
]);
