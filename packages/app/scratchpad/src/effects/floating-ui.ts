import { createSignal } from 'solid-js';
import { collect, pipe, reactive } from '@lib/effects';
import {
  environment,
  getDefaultValue,
  readEnvironment,
  reset,
  subscribe,
  updateConfig,
} from '@lib/runtime-config';
import { tetherEnabled } from '../config';
import { $controlsReset } from '../state/floating-ui';

/**
 * Whether the tether is enabled for the active environment before the
 * persisted override has been read. Prerender and first paint use it.
 */
export const defaultTetherEnabled = getDefaultValue(tetherEnabled).enabled;

/**
 * Whether the tether is enabled for the active environment, as a live
 * accessor, with any persisted OPFS override layered over the default.
 * Changes from any browsing context land here, this tab's own writes
 * included. Releasing the plan drops the subscription.
 */
export const $tetherEnabled = pipe([
  async () => {
    const [enabled, setEnabled] = createSignal(defaultTetherEnabled);
    const unsubscribe = subscribe(tetherEnabled, (value) =>
      setEnabled(value.enabled),
    );

    // Subscribed before reading. A change landing mid-read is at least as
    // fresh as the read, so the read only lands if nothing changed.
    let stale = false;
    const stopStaleWatcher = subscribe(tetherEnabled, () => (stale = true));

    try {
      const read = await readEnvironment(tetherEnabled);
      if (!stale) setEnabled(read.enabled);
    } catch (error) {
      unsubscribe();
      throw error;
    } finally {
      stopStaleWatcher();
    }

    return reactive(enabled, unsubscribe);
  },
]);

/**
 * Persist the tether toggle as the active environment's override. The
 * write echoes back through the subscription `$tetherEnabled` holds.
 */
export const $setTetherEnabled = pipe([
  () =>
    (enabled: boolean): Promise<void> =>
      updateConfig(tetherEnabled, { [environment]: { enabled } }),
]);

/**
 * Put every control back to its default and clear the tether override
 * along with them, so the one persisted control resets like the rest
 * rather than surviving the button that claims to reset everything. The
 * clear echoes back through `$tetherEnabled`.
 */
export const $resetControls = collect(
  [$controlsReset],
  (controlsReset) => (): Promise<void> => {
    controlsReset();
    return reset(tetherEnabled, [environment]);
  },
);
