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
 * Only fires for changes made in *other* browsing contexts — a
 * `BroadcastChannel` never echoes a context its own posts — so a same-tab
 * write is picked up by the mount-time read, not here.
 */
export const watchExperimentalFlag = (
  onChange: (enabled: boolean) => void,
): (() => void) =>
  subscribe(experimentalApp, (defaults) => {
    onChange(defaults[environment].enabled);
  });
