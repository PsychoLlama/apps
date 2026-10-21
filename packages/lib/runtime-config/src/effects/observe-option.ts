import { createSignal } from 'solid-js';
import { reactive, type Reactive } from '@lib/effects';
import { getDefaultValue, readEnvironment, subscribe } from '../config';
import type { JsonValue, Option } from '../define-config';

/**
 * An option's value for the active environment as a live accessor, with
 * any persisted OPFS override layered over the default. Changes from any
 * browsing context land here, this tab's own writes included. Resolves
 * once the override has been read; disposing the resource unsubscribes.
 *
 * Reach for it as a plan step: `pipe([() => observeOption(option)])`.
 */
export const observeOption = async <Value extends JsonValue>(
  option: Option<Value>,
): Promise<Reactive<Value>> => {
  const [value, setValue] = createSignal(getDefaultValue(option));
  const unsubscribe = subscribe(option, setValue);

  // Subscribed before reading. A change landing mid-read is at least as
  // fresh as the read, so the read only lands if nothing changed. The
  // default never shows: this resolves after the read.
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
