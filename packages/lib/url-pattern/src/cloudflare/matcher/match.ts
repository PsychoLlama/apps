import type { Context } from '../context.ts';
import type { MatcherInit, Regexes } from './compile.ts';

/** Matches a URL against a matcher's regexes. `null` when it doesn't match. */
export const match = <Ident extends string>(
  regexes: Regexes<MatcherInit, Ident>,
  url: URL,
): Context<Ident> | null => {
  const result = new RegExp(regexes.pathname).exec(url.pathname);

  // The regex has a named group per var, so `groups` holds exactly the
  // matcher's vars, or `undefined` for a literal comparison.
  return result && ({ ...result.groups } as Context<Ident>);
};
