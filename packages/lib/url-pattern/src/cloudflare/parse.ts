import type { VarIdents } from './infer.ts';

/** A parsed Cloudflare URL pattern. Create one with {@link parse}. */
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
export const parse = <const Source extends string>(
  source: Source,
): Pattern<VarIdents<Source>> => {
  throw new Error(`Not implemented: ${source}`);
};
