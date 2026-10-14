import type { Pattern } from './parse.ts';

/** Captured values by name. A splat is captured as `splat`. */
export type Params = Record<string, string>;

/** Matches a URL against a pattern. `null` when it doesn't match. */
export const match = (pattern: Pattern, url: URL): Params | null => {
  throw new Error(`Not implemented: ${pattern.source} ${url.href}`);
};
