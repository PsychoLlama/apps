import type { Context } from './match.ts';

/**
 * Fills `:name` references in a template, such as a redirect destination
 * or a header value, with values from a context.
 *
 * Throws on a reference that starts with a shorter var's name, like
 * `:identity` alongside `:id`, which Cloudflare would fill ambiguously.
 */
export const format = (template: string, context: Context): string => {
  throw new Error(`Not implemented: ${template} ${JSON.stringify(context)}`);
};
