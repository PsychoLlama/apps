import type { Context } from '../context.ts';
import type { Pattern, PatternInit } from './compile.ts';

/** Matches a URL against a pattern. `null` when it doesn't match. */
export const match = <Ident extends string>(
  [matchers]: Pattern<PatternInit, Ident>,
  url: URL,
): Context<Ident> | null => {
  throw new Error(`Not implemented: ${matchers.pathname} ${url.href}`);
};
