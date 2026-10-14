import type { Plugin } from 'vite';
import { DEFAULT_RULES } from './defaults.ts';
import { formatHeaders } from './format.ts';

/** Response headers for every path matching a pattern. */
export interface HeadersRule {
  /** A path pattern in `_headers` syntax: `:name` placeholders and `*` splats. */
  pattern: string;

  /** Header names to values. */
  headers: Record<string, string>;
}

/** Options for {@link headers}. */
export interface HeadersConfig {
  /**
   * Rules to add after {@link DEFAULT_RULES}. Rules sharing a pattern
   * merge into one block, placed where the pattern first appears.
   * Cloudflare applies headers in file order.
   */
  rules: HeadersRule[];
}

/**
 * Vite plugin that writes Cloudflare's `_headers` into the build output,
 * starting with {@link DEFAULT_RULES}. Dev serves none of them.
 */
export const headers = (config?: HeadersConfig): Plugin => ({
  name: '@dev/vite-plugin-headers',
  apply: 'build',

  // Lands at the site root with the rest of the browser bundle.
  applyToEnvironment: (environment) => environment.config.consumer === 'client',

  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: '_headers',
      source: formatHeaders([...DEFAULT_RULES, ...(config?.rules ?? [])]),
    });
  },
});
