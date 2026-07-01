/**
 * Browser-suite entry for this package. Re-exports the shared preset from
 * `@dev/vitest-config`; Vitest resolves its root to this file's directory, so
 * the suite only runs this package's `*.test.browser.*` tests. The
 * `test:browser` script wraps `vitest` in `s6-setlock` to serialize Chromium
 * across packages and worktrees.
 */
export { browserConfig as default } from '@dev/vitest-config';
