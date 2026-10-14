import type { Plugin } from 'vite';

/** Options for {@link redirects}. */
export interface RedirectsConfig {
  /** Lines of Cloudflare's `_redirects`: `<from> <to> [status]`. */
  rules: string[];
}

/**
 * Vite plugin that writes Cloudflare's `_redirects` into the build
 * output. Dev serves no redirects.
 */
export const redirects = (config: RedirectsConfig): Plugin => ({
  name: '@dev/vite-plugin-redirects',
  apply: 'build',

  // Lands at the site root with the rest of the browser bundle.
  applyToEnvironment: (environment) => environment.config.consumer === 'client',

  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: '_redirects',
      source: `${config.rules.join('\n')}\n`,
    });
  },
});
