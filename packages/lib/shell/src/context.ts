/**
 * Per-app identity the shell renders with. Each app provides it once at
 * its root, so the shared chrome (header, 404, error page) reads the
 * app's own name instead of hard-coding the launcher's.
 */

import { assert } from '@lib/assert';
import { createContext, useContext } from 'solid-js';

/** Standard fields every app hands the shell. */
export interface AppConfig {
  /** Display name: the header's root crumb and the fallback page title. */
  name: string;
}

const AppContext = createContext<AppConfig>();

/**
 * Provide the app's config to every shell component beneath it. Read
 * once at mount: pass a static object.
 */
export const AppProvider = AppContext.Provider;

/** Read the config from the nearest `<AppProvider>`. */
export const useAppConfig = (): AppConfig => {
  const config = useContext(AppContext);
  assert(config, 'Shell component rendered outside of <AppProvider>.');

  return config;
};
