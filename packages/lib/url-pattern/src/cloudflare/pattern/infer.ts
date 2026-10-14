import type { PlaceholderIdents } from '../ident.ts';

/**
 * Vars a literal pattern binds, or `string` when the pattern isn't known
 * statically. Only extracts identifiers: patterns `compilePattern` rejects
 * aren't caught here.
 */
export type PatternIdents<Source extends string> = string extends Source
  ? string
  : | PlaceholderIdents<Source>
    | (Source extends `${string}*${string}` ? 'splat' : never);
