import { defineConfig } from '@lib/runtime-config';

/** The value of the {@link filter} option. */
export type Filter = {
  /**
   * Which logs reach the browser console, in `@holz/pattern-filter`
   * syntax: debug-style globs and negation, matched against `log.origin`.
   * `*` shows everything; `''` shows nothing.
   */
  pattern: string;
};

/**
 * Runtime option gating which logs reach the browser console. Resolved per
 * environment with an OPFS-persisted override on top (see
 * `@lib/holz-config-filter`), so production logging can be turned on live
 * while troubleshooting — no rebuild, and it reaches workers too.
 *
 * The deployed-but-pre-prod environments show everything; production stays
 * silent until explicitly opted in.
 */
export const filter = defineConfig<Filter>('@lib/observability:filter', {
  development: { pattern: '*' },
  staging: { pattern: '*' },
  production: { pattern: '' },
});
