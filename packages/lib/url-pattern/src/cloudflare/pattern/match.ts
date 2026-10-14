import type { Context } from '../context.ts';
import type { Pattern } from './parse.ts';

/** Matches a URL against a pattern. `null` when it doesn't match. */
export const match = <Ident extends string>(
  pattern: Pattern<Ident>,
  url: URL,
): Context<Ident> | null => {
  throw new Error(`Not implemented: ${pattern.source} ${url.href}`);
};
