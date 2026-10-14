import type { Pattern } from '../pattern/parse.ts';
import type { TemplateIdents } from './infer.ts';

/**
 * A parsed template: a redirect destination or header value. Create one
 * with {@link parseTemplate}.
 */
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
 * Pass the rule's pattern as `scope` to resolve references against the
 * vars it binds. Throws if a reference is unbound, or starts with a
 * shorter var's identifier, like `:identity` alongside `:id`, which
 * Cloudflare fills ambiguously.
 */
export const parseTemplate = <
  const Source extends string,
  Ident extends string = string,
>(
  source: Source,
  scope?: Pattern<Ident> & InScope<Source, Ident>,
): Template<TemplateIdents<Source> & Ident> => {
  throw new Error(`Not implemented: ${source} ${scope?.source}`);
};

// Fails to typecheck when a literal template references vars a literal
// pattern doesn't bind. Non-literal sources are only checked at runtime.
type InScope<
  Source extends string,
  Ident extends string,
> = string extends Source
  ? unknown
  : [Exclude<TemplateIdents<Source>, Ident>] extends [never]
    ? unknown
    : { unbound: Exclude<TemplateIdents<Source>, Ident> };
