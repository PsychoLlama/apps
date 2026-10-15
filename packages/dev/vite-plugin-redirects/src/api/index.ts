import type { Regexes, Template } from '@lib/url-pattern/cloudflare';
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
  statusCode: number,
];

/**
 * A `RedirectRule` compiled for matching outside Cloudflare, like in a
 * service worker. Plain data, so it survives `JSON.stringify`.
 *
 * - `regexes`: match the source with `match` from
 *   `@lib/url-pattern/cloudflare`.
 * - `template`: fill the destination with `format`.
 * - `statusCode`: resolved to Cloudflare's `302` when the rule omits it.
 */
export type CompiledRedirectRule = [
  regexes: Regexes,
  template: Template,
  statusCode: number,
];

/**
 * What the plugin exposes to other plugins. Find it with
 * {@link getRedirectsApi}.
 */
export interface RedirectsApi {
  /** A copy of the rules, in `_redirects` order (also match order). */
  getRules(): RedirectRule[];

  /** A copy of the rules, compiled, in the same order. */
  getCompiledRules(): CompiledRedirectRule[];
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
