import type { Plugin } from 'vite';

/** Options for {@link headers}. */
export interface HeadersConfig {
  /**
   * Response headers to attach, keyed by the path pattern they apply to.
   * Patterns use `_headers` syntax: `:name` placeholders and `*` splats.
   */
  rules: Record<string, Record<string, string>>;
}

/**
 * Vite plugin that writes Cloudflare's `_headers` into the build output.
 * Dev serves none of them.
 */
export const headers = (config: HeadersConfig): Plugin => ({
  name: '@dev/vite-plugin-headers',
  apply: 'build',

  // Lands at the site root with the rest of the browser bundle.
  applyToEnvironment: (environment) => environment.config.consumer === 'client',

  generateBundle() {
    const blocks = Object.entries(config.rules).map(([path, fields]) =>
      [
        path,
        ...Object.entries(fields).map(([name, value]) => `  ${name}: ${value}`),
      ].join('\n'),
    );

    this.emitFile({
      type: 'asset',
      fileName: '_headers',
      source: `${blocks.join('\n\n')}\n`,
    });
  },
});
