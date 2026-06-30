import { readEnvironment, subscribe } from '@lib/runtime-config';
import { logExport } from '../../config';

/**
 * Resolve whether logs export is enabled for the active environment,
 * layering any persisted OPFS override over the default.
 */
export const readExportFlag = async (): Promise<boolean> =>
  (await readEnvironment(logExport)).enabled;

/**
 * Watch for changes to the export flag, reporting the resolved value for
 * the active environment. Returns an unsubscribe.
 *
 * Fires for changes from any browsing context, including same-tab writes,
 * so this is the live source of truth after the mount-time read seeds it.
 */
export const watchExportFlag = (
  onChange: (enabled: boolean) => void,
): (() => void) =>
  subscribe(logExport, (value) => {
    onChange(value.enabled);
  });
