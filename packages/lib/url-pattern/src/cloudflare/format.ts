import type { Params } from './match.ts';

/**
 * Fills `:name` references in a template, such as a redirect destination
 * or a header value, with captured params.
 *
 * Throws on a reference that starts with a shorter param's name, like
 * `:identity` alongside `:id`, which Cloudflare would fill ambiguously.
 */
export const format = (template: string, params: Params): string => {
  throw new Error(`Not implemented: ${template} ${JSON.stringify(params)}`);
};
