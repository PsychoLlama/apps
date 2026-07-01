/**
 * Browser-suite entry for this package. Re-exports the shared preset from
 * `@dev/vitest-config`. Vitest scopes its root to the cwd — the package
 * directory turbo runs the script in — so the preset's relative `include`
 * only matches this package's `*.test.browser.*` tests. The `test:browser`
 * script wraps `vitest` in `chromium-lock` to serialize Chromium across
 * packages and worktrees.
 */
export { browserConfig as default } from '@dev/vitest-config';
