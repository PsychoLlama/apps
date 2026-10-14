import { tokenizeWithSplats } from '../tokenize/tokenize.ts';
import type { Token } from '../tokenize/tokens.ts';
import type { MatcherIdents } from '../infer/matcher.ts';

/** The parts of a URL a matcher matches. */
export interface MatcherInit {
  /** Matches the URL's pathname, like `/blog/:year/*`. */
  pathname: string;
}

/**
 * A compiled matcher: a `_redirects` source or `_headers` path.
 *
 * - `regexes` mirrors the init: an anchored regex source per part, with
 *   a named group per var.
 * - `vars` lists what a successful match always binds. A splat is
 *   `splat`.
 */
export type Matcher<
  Init extends MatcherInit = MatcherInit,
  Ident extends string = string,
> = readonly [regexes: Regexes<Init, Ident>, vars: ReadonlySet<Ident>];

/**
 * Regex sources for each part of the URL a matcher matches. This is what
 * `match` runs, so it's what ships.
 *
 * `Ident` types the vars a match binds. It exists only in the type, so
 * plain data, like `{ pathname }` from a manifest, binds `string`.
 */
export type Regexes<
  Init extends MatcherInit = MatcherInit,
  Ident extends string = string,
> = {
  readonly [Part in keyof Init & keyof MatcherInit]: string;
} & { readonly [phantomIdent]?: Ident };

declare const phantomIdent: unique symbol;

/**
 * Compiles a `_redirects` source or `_headers` path. Throws on patterns
 * Cloudflare would drop.
 *
 * Needs `RegExp.escape`, so compile in the build and ship the result.
 */
export const compileMatcher = <const Init extends MatcherInit>(
  init: Init,
): Matcher<Init, MatcherIdents<Init['pathname']>> => {
  const tokens = tokenizeWithSplats(init.pathname);
  const vars = bind(init.pathname, tokens);

  return [
    { pathname: `^${tokens.map(toRegex).join('')}$` },
    vars as Set<MatcherIdents<Init['pathname']>>,
  ];
};

/** Raised for a pattern Cloudflare would drop. */
export class MatcherError extends Error {
  /** The pattern as written. */
  readonly source: string;

  constructor(message: string, source: string) {
    super(`${message}: ${source}`);
    this.name = 'MatcherError';
    this.source = source;
  }
}

// Collects the vars a pattern binds, rejecting the ones Cloudflare's
// rules engine would compile into duplicate capture groups.
const bind = (source: string, tokens: Token[]) => {
  const vars = new Set<string>();

  for (const token of tokens) {
    if (token.type === 'literal') continue;
    const ident = token.type === 'splat' ? 'splat' : token.name;

    if (vars.has(ident)) {
      throw new MatcherError(
        ident === 'splat'
          ? 'Pattern binds more than one splat'
          : `Pattern binds :${ident} more than once`,
        source,
      );
    }

    // Cloudflare fills placeholders in order with a plain string replace,
    // so an earlier `:id` also rewrites the front of a later `:identity`.
    for (const earlier of vars) {
      if (token.type === 'ident' && ident.startsWith(earlier)) {
        throw new MatcherError(
          `Pattern binds :${ident} after :${earlier}, which Cloudflare reads as :${earlier} again`,
          source,
        );
      }
    }

    vars.add(ident);
  }

  return vars;
};

const toRegex = (token: Token) => {
  switch (token.type) {
    case 'literal':
      return RegExp.escape(token.text);
    case 'ident':
      return `(?<${token.name}>[^/]+)`;
    case 'splat':
      return '(?<splat>.*)';
  }
};
