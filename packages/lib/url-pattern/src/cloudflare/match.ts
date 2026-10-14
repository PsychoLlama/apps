import type { Pattern } from './parse.ts';

/** Values bound to vars, by name. A splat is bound as `splat`. */
export type Context<Ident extends string = string> = Record<Ident, string>;

/** Matches a URL against a pattern. `null` when it doesn't match. */
export const match = <Ident extends string>(
  pattern: Pattern<Ident>,
  url: URL,
): Context<Ident> | null => {
  throw new Error(`Not implemented: ${pattern.source} ${url.href}`);
};
