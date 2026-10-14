/** A parsed Cloudflare URL pattern. Create one with {@link parse}. */
export interface Pattern {
  /** The pattern as written. */
  readonly source: string;
}

/**
 * Parses a `_redirects` source or `_headers` path. Throws on patterns
 * Cloudflare would drop.
 */
export const parse = (source: string): Pattern => {
  throw new Error(`Not implemented: ${source}`);
};
