import { collect, pipe } from '@lib/effects';
import {
  environment,
  getDefaultValue,
  reset,
  updateConfig,
} from '@lib/runtime-config';
import { observeOption } from '@lib/runtime-config/effects';
import { tetherEnabled } from '../config';
import { $controlsReset } from '../state/floating-ui';

/**
 * Whether the tether is enabled for the active environment before the
 * persisted override has been read. Prerender and first paint use it.
 */
export const defaultTetherEnabled = getDefaultValue(tetherEnabled).enabled;

/**
 * The tether option for the active environment, as a live accessor, with
 * any persisted OPFS override layered over the default. Changes from any
 * browsing context land here, this tab's own writes included. Releasing
 * the plan drops the subscription.
 */
export const $tetherEnabled = pipe([() => observeOption(tetherEnabled)]);

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
