import { readEnvironment, subscribe } from '@lib/runtime-config';
import { enabled as shareAppEnabled } from '@app/share/config';

/**
 * Resolve whether the share app is enabled for the active environment,
 * layering any persisted OPFS override over the default.
 */
export const readShareFlag = async (): Promise<boolean> =>
  (await readEnvironment(shareAppEnabled)).enabled;

/**
 * Watch for changes to the share flag, reporting the resolved value for
 * the active environment. Returns an unsubscribe.
 *
 * Fires for changes from any browsing context, including same-tab writes,
 * so this is the live source of truth after the mount-time read seeds it.
 */
export const watchShareFlag = (
  onChange: (enabled: boolean) => void,
): (() => void) =>
  subscribe(shareAppEnabled, (value) => {
    onChange(value.enabled);
  });
