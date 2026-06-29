import { environment, readEnvironment, subscribe } from '@lib/runtime-config';
import { experimentalApp } from '@app/experimental/config';

/**
 * Resolve whether the experimental app is enabled for the active
 * environment, layering any persisted OPFS override over the default.
 */
export const readExperimentalFlag = async (): Promise<boolean> =>
  (await readEnvironment(experimentalApp)).enabled;

/**
 * Watch for changes to the experimental flag, reporting the resolved
 * value for the active environment. Returns an unsubscribe.
 *
 * Fires for changes from any browsing context, including same-tab writes,
 * so this is the live source of truth after the mount-time read seeds it.
 */
export const watchExperimentalFlag = (
  onChange: (enabled: boolean) => void,
): (() => void) =>
  subscribe(experimentalApp, (defaults) => {
    onChange(defaults[environment].enabled);
  });
