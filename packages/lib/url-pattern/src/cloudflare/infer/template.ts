import type { PlaceholderIdents } from './ident.ts';

/**
 * Vars a literal template references, or `string` when the template isn't
 * known statically. Unlike in a matcher, `*` is a literal.
 */
export type TemplateIdents<Source extends string> = string extends Source
  ? string
  : PlaceholderIdents<Source>;
