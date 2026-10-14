import type { PatternIdents } from './infer.ts';

/**
 * A parsed match pattern: a `_redirects` source or `_headers` path.
 * Create one with {@link parsePattern}.
 */
export interface Pattern<Ident extends string = string> {
  /** The pattern as written. */
  readonly source: string;

  /** Vars a successful match always binds. A splat is `splat`. */
  readonly vars: ReadonlySet<Ident>;
}

/**
 * Parses a `_redirects` source or `_headers` path. Throws on patterns
 * Cloudflare would drop.
 */
export const parsePattern = <const Source extends string>(
  source: Source,
): Pattern<PatternIdents<Source>> => {
  throw new Error(`Not implemented: ${source}`);
};
