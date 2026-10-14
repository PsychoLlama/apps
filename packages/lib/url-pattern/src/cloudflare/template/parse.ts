import type { Matcher, MatcherInit } from '../matcher/compile.ts';
import type { TemplateIdents } from '../infer/template.ts';

/** A parsed template: a redirect destination or header value. */
export interface Template<Ident extends string = string> {
  /** The template as written. */
  readonly source: string;

  /** Vars the template references. */
  readonly vars: ReadonlySet<Ident>;
}

/**
 * Parses a redirect destination or header value. Any text is a valid
 * template: `:name` references a var, and everything else, `*` included,
 * is literal.
 *
 * Pass the rule's matcher as `scope` to resolve references against the
 * vars it binds. Throws if a reference is unbound.
 */
export const parseTemplate = <
  const Source extends string,
  Ident extends string = string,
>(
  source: Source,
  scope?: Matcher<MatcherInit, Ident> & InScope<Source, Ident>,
): Template<TemplateIdents<Source> & Ident> => {
  throw new Error(`Not implemented: ${source} ${scope?.[0].pathname}`);
};

// Fails to typecheck when a literal template references vars a literal
// matcher doesn't bind. Non-literal sources are only checked at runtime.
type InScope<
  Source extends string,
  Ident extends string,
> = string extends Source
  ? unknown
  : [Exclude<TemplateIdents<Source>, Ident>] extends [never]
    ? unknown
    : { unbound: Exclude<TemplateIdents<Source>, Ident> };
