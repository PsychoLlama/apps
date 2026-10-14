import type { Context } from './match.ts';
import type { Pattern } from './parse.ts';

/**
 * Compiles a template, such as a redirect destination or a header value,
 * into a function that fills its `:name` references from a context.
 *
 * Throws if the template references a var the pattern doesn't bind, or
 * one that starts with a shorter var's name, like `:identity` alongside
 * `:id`, which Cloudflare would fill ambiguously.
 */
export const format = <Ident extends string>(
  pattern: Pattern<Ident>,
  template: string,
): ((context: Context<Ident>) => string) => {
  throw new Error(`Not implemented: ${pattern.source} ${template}`);
};
