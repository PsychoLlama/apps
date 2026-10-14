import type { Plugin } from 'vite';
import { PLUGIN_NAME } from './constants.ts';

/**
 * What the plugin exposes to other plugins. Find it with
 * {@link getRedirectsApi}.
 */
export interface RedirectsApi {
  /** Rules in `_redirects` order, which is also match order. */
  getRules(): readonly string[];
}

/**
 * Finds the redirects plugin's API among resolved plugins, e.g.
 * `config.plugins` in `configResolved`, so other plugins can read the
 * rules without being configured with them. `undefined` when the app has
 * no redirects, or in dev, where the plugin doesn't apply.
 */
export const getRedirectsApi = (
  plugins: readonly Plugin[],
): RedirectsApi | undefined => {
  const plugin = plugins.find(({ name }) => name === PLUGIN_NAME);

  return (plugin as Plugin<RedirectsApi> | undefined)?.api;
};
