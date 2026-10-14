import type { Context } from '../context.ts';
import type { Matcher, MatcherInit } from './compile.ts';

/** Matches a URL against a matcher. `null` when it doesn't match. */
export const match = <Ident extends string>(
  [regexes]: Matcher<MatcherInit, Ident>,
  url: URL,
): Context<Ident> | null => {
  throw new Error(`Not implemented: ${regexes.pathname} ${url.href}`);
};
