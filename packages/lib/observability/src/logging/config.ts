import { defineOption } from '@lib/runtime-config';

/**
 * Runtime pattern gating which logs reach the browser console. Resolved per
 * environment with an OPFS-persisted override on top (see
 * `@lib/holz-config-filter`), so production logging can be turned on live
 * while troubleshooting — no rebuild, and it reaches workers too.
 *
 * The deployed-but-pre-prod environments show everything (`*`); production
 * stays silent (`''`) until explicitly opted in. Values use
 * `@holz/pattern-filter` syntax (debug-style globs and negation, matched
 * against `log.origin`).
 */
export const filter = defineOption('log-filter', {
  development: { pattern: '*' },
  staging: { pattern: '*' },
  production: { pattern: '' },
});
