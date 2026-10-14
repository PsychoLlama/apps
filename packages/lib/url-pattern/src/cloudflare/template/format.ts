import type { Context } from '../context.ts';
import type { Template } from './compile.ts';

/**
 * Fills a template's references from a context, in one pass. Throws if
 * the context is missing a var the template references.
 */
export const format = <Ident extends string>(
  template: Template<Ident>,
  context: Context<NoInfer<Ident>>,
): string =>
  template.reduce((output, token) => {
    if (token.type === 'literal') return output + token.text;

    // A plain lookup would find inherited keys like `constructor`.
    if (!Object.hasOwn(context, token.name)) {
      throw new FormatError(`Context is missing :${token.name}`);
    }

    return output + context[token.name];
  }, '');

/** Raised when a context can't fill a template. */
export class FormatError extends Error {
  override name = 'FormatError';
}
