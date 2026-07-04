import { readEnvironment, subscribe } from '@lib/runtime-config';
import { enabled as beamAppEnabled } from '@app/beam/config';

/**
 * Resolve whether the beam app is enabled for the active environment,
 * layering any persisted OPFS override over the default.
 */
export const readBeamFlag = async (): Promise<boolean> =>
  (await readEnvironment(beamAppEnabled)).enabled;

/**
 * Watch for changes to the beam flag, reporting the resolved value for
 * the active environment. Returns an unsubscribe.
 *
 * Fires for changes from any browsing context, including same-tab writes,
 * so this is the live source of truth after the mount-time read seeds it.
 */
export const watchBeamFlag = (
  onChange: (enabled: boolean) => void,
): (() => void) =>
  subscribe(beamAppEnabled, (value) => {
    onChange(value.enabled);
  });
