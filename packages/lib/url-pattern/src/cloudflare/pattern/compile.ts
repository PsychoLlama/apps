import { tokenizeWithSplats, type Token } from '../tokenize.ts';
import type { PatternIdents } from '../infer/pattern.ts';

/** The parts of a URL a pattern matches. */
export interface PatternInit {
  /** Matches the URL's pathname, like `/blog/:year/*`. */
  pathname: string;
}

/**
 * A compiled match pattern: a `_redirects` source or `_headers` path.
 *
 * - `matchers` mirrors the init: an anchored regex source per part, with
 *   a named group per var.
 * - `vars` lists what a successful match always binds. A splat is
 *   `splat`.
 */
export type Pattern<
  Init extends PatternInit = PatternInit,
  Ident extends string = string,
> = readonly [matchers: Matchers<Init>, vars: ReadonlySet<Ident>];

/** Regex sources for each part of the URL a pattern matches. */
export type Matchers<Init extends PatternInit = PatternInit> = {
  readonly [Part in keyof Init & keyof PatternInit]: string;
};

/**
 * Compiles a `_redirects` source or `_headers` path. Throws on patterns
 * Cloudflare would drop.
 *
 * Needs `RegExp.escape`, so compile in the build and ship the result.
 */
export const compilePattern = <const Init extends PatternInit>(
  init: Init,
): Pattern<Init, PatternIdents<Init['pathname']>> => {
  const tokens = tokenizeWithSplats(init.pathname);
  const vars = bind(init.pathname, tokens);

  return [
    { pathname: `^${tokens.map(toRegex).join('')}$` },
    vars as Set<PatternIdents<Init['pathname']>>,
  ];
};

/** Raised for a pattern Cloudflare would drop. */
export class PatternError extends Error {
  /** The pattern as written. */
  readonly source: string;

  constructor(message: string, source: string) {
    super(`${message}: ${source}`);
    this.name = 'PatternError';
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
      throw new PatternError(
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
        throw new PatternError(
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
