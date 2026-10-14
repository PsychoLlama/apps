import type { Pattern } from './parse.ts';

/** Values bound to vars, by name. A splat is bound as `splat`. */
export type Context<Name extends string = string> = Record<Name, string>;

/** Matches a URL against a pattern. `null` when it doesn't match. */
export const match = <Name extends string>(
  pattern: Pattern<Name>,
  url: URL,
): Context<Name> | null => {
  throw new Error(`Not implemented: ${pattern.source} ${url.href}`);
};
