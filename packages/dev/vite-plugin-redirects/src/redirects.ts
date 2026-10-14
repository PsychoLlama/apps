import type { Plugin } from 'vite';
import { PLUGIN_NAME } from './constants.ts';
import type { RedirectsApi } from './external-api.ts';

/** Options for {@link redirects}. */
export interface RedirectsConfig {
  /** Lines of Cloudflare's `_redirects`: `<from> <to> [status]`. */
  rules: string[];
}

/**
 * Vite plugin that writes Cloudflare's `_redirects` into the build
 * output. Dev serves no redirects.
 */
export const redirects = (config: RedirectsConfig): Plugin<RedirectsApi> => {
  const api: RedirectsApi = {
    getRules: () => config.rules,
  };

  return {
    name: PLUGIN_NAME,
    apply: 'build',
    api,

    // Lands at the site root with the rest of the browser bundle.
    applyToEnvironment: (environment) =>
      environment.config.consumer === 'client',

    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: '_redirects',
        source: `${api.getRules().join('\n')}\n`,
      });
    },
  };
};
