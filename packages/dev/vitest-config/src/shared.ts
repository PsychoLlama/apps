/**
 * Shared Vitest building blocks for the workspace's test suites.
 *
 * Both suites are split per package: each package owns a `vitest.unit.config.ts`
 * and/or `vitest.browser.config.ts` re-exporting `@dev/vitest-config/unit` or
 * `@dev/vitest-config/browser` (the latter run under `chromium-lock`), so turbo
 * caches and reruns tests per package instead of the whole monorepo on every
 * change. Both suites transform source through `substrate()`, the same Vite
 * plugin pipeline the apps build with.
 */

/**
 * Inline `@solidjs/*` so Vite compiles the raw `.jsx` they publish under
 * their `"solid"` export condition. Upstream:
 * https://github.com/solidjs/vite-plugin-solid/issues/157
 */
export const sharedServerDeps = { inline: [/@solidjs\//] };
