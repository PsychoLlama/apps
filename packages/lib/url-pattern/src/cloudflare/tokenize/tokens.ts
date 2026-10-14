/** Text between vars, taken as-is. */
export interface LiteralToken {
  type: 'literal';
  text: string;
}

/** A `:name` placeholder. */
export interface IdentToken<Name extends string = string> {
  type: 'ident';
  name: Name;
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
