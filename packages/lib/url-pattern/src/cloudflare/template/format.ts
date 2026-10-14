import type { Context } from '../context.ts';
import type { Template } from './parse.ts';

/**
 * Fills a template's references from a context, in one pass. Throws if
 * the context is missing a var the template references.
 */
export const format = <Ident extends string>(
  template: Template<Ident>,
  context: Context<NoInfer<Ident>>,
): string => {
  throw new Error(
    `Not implemented: ${template.source} ${JSON.stringify(context)}`,
  );
};
