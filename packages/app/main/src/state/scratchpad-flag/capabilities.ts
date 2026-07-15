import { readEnvironment, subscribe } from '@lib/runtime-config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';

/**
 * Resolve whether the scratchpad app is enabled for the active
 * environment, layering any persisted OPFS override over the default.
 */
export const readScratchpadFlag = async (): Promise<boolean> =>
  (await readEnvironment(scratchpadAppEnabled)).enabled;

/**
 * Watch for changes to the scratchpad flag, reporting the resolved
 * value for the active environment. Returns an unsubscribe.
 *
 * Fires for changes from any browsing context, including same-tab writes,
 * so this is the live source of truth after the mount-time read seeds it.
 */
export const watchScratchpadFlag = (
  onChange: (enabled: boolean) => void,
): (() => void) =>
  subscribe(scratchpadAppEnabled, (value) => {
    onChange(value.enabled);
  });
