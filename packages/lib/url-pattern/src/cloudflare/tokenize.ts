// Keep in sync with `PlaceholderIdents` in `infer/ident.ts`.
const IDENT = /:[A-Za-z]\w*/g;
const IDENT_OR_SPLAT = /:[A-Za-z]\w*|\*/g;

/** Text between vars, taken as-is. */
export interface LiteralToken {
  type: 'literal';
  text: string;
}

/** A `:name` placeholder. */
export interface IdentToken {
  type: 'ident';
  name: string;
}

/** A `*`, bound as `splat`. */
export interface SplatToken {
  type: 'splat';
}

export type Token = LiteralToken | IdentToken | SplatToken;

export const literal = (text: string): LiteralToken => ({
  type: 'literal',
  text,
});

/** `name` excludes the leading `:`. */
export const ident = (name: string): IdentToken => ({ type: 'ident', name });

export const splat = (): SplatToken => ({ type: 'splat' });

/**
 * Splits text into literals and `:name` placeholders: `:`, a letter, then
 * word characters. Everything else, `*` included, is literal. For
 * templates.
 */
export const tokenize = (source: string): Array<LiteralToken | IdentToken> =>
  scan(source, IDENT, toIdent);

/** Like `tokenize`, but each `*` is a splat. For match patterns. */
export const tokenizeWithSplats = (source: string): Token[] =>
  scan(source, IDENT_OR_SPLAT, (text) =>
    text === '*' ? splat() : toIdent(text),
  );

// Splits `source` around each match of `vars`, keeping the text between
// as literals.
const scan = <Var>(
  source: string,
  vars: RegExp,
  toVar: (text: string) => Var,
): Array<LiteralToken | Var> => {
  const tokens: Array<LiteralToken | Var> = [];
  let end = 0;

  for (const { 0: text, index } of source.matchAll(vars)) {
    if (index > end) {
      tokens.push(literal(source.slice(end, index)));
    }

    tokens.push(toVar(text));
    end = index + text.length;
  }

  if (end < source.length) {
    tokens.push(literal(source.slice(end)));
  }

  return tokens;
};

// Drops the leading `:`.
const toIdent = (text: string) => ident(text.slice(1));
