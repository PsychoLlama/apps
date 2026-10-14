import { tokenize } from '../tokenize/tokenize.ts';
import type { IdentToken, LiteralToken } from '../tokenize/tokens.ts';
import type { TemplateIdents } from '../infer/template.ts';

/** A redirect destination or header value, as tokens for `format`. */
export type Template<Ident extends string = string> = ReadonlyArray<
  LiteralToken | IdentToken<Ident>
>;

/**
 * A compiled template.
 *
 * - `template` is what `format` fills. It's plain data, so it can ship.
 * - `vars` lists the vars it references, for checking against a matcher
 *   with `assertCompatible`.
 */
export type CompiledTemplate<Ident extends string = string> = readonly [
  template: Template<Ident>,
  vars: ReadonlySet<Ident>,
];

/**
 * Compiles a redirect destination or header value. Any text is a valid
 * template: `:name` references a var, and everything else, `*` included,
 * is literal.
 */
export const compileTemplate = <const Source extends string>(
  source: Source,
): CompiledTemplate<TemplateIdents<Source>> => {
  const template = tokenize(source) as Template<TemplateIdents<Source>>;
  const vars = new Set(
    template.flatMap((token) => (token.type === 'ident' ? [token.name] : [])),
  );

  return [template, vars];
};
