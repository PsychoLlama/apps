import type { Matcher, MatcherInit } from '../matcher/compile.ts';
import type { CompiledTemplate } from './compile.ts';

/**
 * Throws if the template references a var the matcher doesn't bind. Run it
 * in the build, where both halves of a rule are known.
 *
 * A reference that only starts with a bound var, like `:idx` against
 * `:id`, is unbound too. Cloudflare would fill the `:id` and leave the `x`.
 */
export const assertCompatible = <
  MatcherIdent extends string,
  TemplateIdent extends string,
>(
  [, bound]: Matcher<MatcherInit, MatcherIdent>,
  [, vars]: CompiledTemplate<TemplateIdent> &
    InScope<TemplateIdent, MatcherIdent>,
): void => {
  for (const ident of vars) {
    if (!(bound as ReadonlySet<string>).has(ident)) {
      throw new TemplateError(
        `Template references :${ident}, which the matcher doesn't bind`,
      );
    }
  }
};

/** Raised for a template that doesn't fit its matcher. */
export class TemplateError extends Error {
  override name = 'TemplateError';
}

// Fails to typecheck when the template references vars the matcher doesn't
// bind. A `string` on either side is only checked at runtime.
type InScope<
  TemplateIdent extends string,
  MatcherIdent extends string,
> = string extends TemplateIdent | MatcherIdent
  ? unknown
  : [Exclude<TemplateIdent, MatcherIdent>] extends [never]
    ? unknown
    : { unbound: Exclude<TemplateIdent, MatcherIdent> };
