import type { Plugin } from 'vite';
import { PLUGIN_NAME } from '../constants.ts';

/**
 * One line of Cloudflare's `_redirects`.
 *
 * - `source`: path to match. Supports `:placeholder` and a trailing `*`
 *   splat.
 * - `destination`: path or URL to send it to. Can use the source's
 *   placeholders and `:splat`.
 * - `statusCode`: defaults to Cloudflare's `302`. `200` is a rewrite: it
 *   serves the destination without changing the URL.
 */
export type RedirectRule = [
  source: string,
  destination: string,
  statusCode?: number,
];

/**
 * What the plugin exposes to other plugins. Find it with
 * {@link getRedirectsApi}.
 */
export interface RedirectsApi {
  /** A copy of the rules, in `_redirects` order (also match order). */
  getRules(): RedirectRule[];
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
