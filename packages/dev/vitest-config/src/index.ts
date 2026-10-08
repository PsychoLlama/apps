/**
 * Shared Vitest building blocks for the workspace's test suites.
 *
 * Both suites are split per package: each package owns a `vitest.unit.config.ts`
 * and/or `vitest.browser.config.ts` re-exporting `@dev/vitest-config/unit` or
 * `@dev/vitest-config/browser` (the latter run under `chromium-lock`), so turbo
 * caches and reruns tests per package instead of the whole monorepo on every
 * change. Both suites must transform source through the *same* Vite plugin
 * pipeline, so it lives here as the single source of truth.
 */

import solid from 'vite-plugin-solid';
import Icons from 'unplugin-icons/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { instrumentationScope } from '@dev/vite-plugin-instrumentation-scope';
import { eraseOverloadSignatures } from '@dev/babel-plugin-erase-overload-signatures';

/**
 * The Vite plugin pipeline every suite shares — the Solid compiler, icon
 * virtual modules, and vanilla-extract — so a module under test transforms
 * exactly the way it does in the app. A factory (not a shared array) so each
 * config gets its own plugin instances rather than aliasing stateful ones.
 */
export const sharedPlugins = () => [
  instrumentationScope(),
  solid({ babel: { plugins: [eraseOverloadSignatures()] } }),
  Icons({ compiler: 'solid' }),
  vanillaExtractPlugin(),
];

/**
 * Inline `@solidjs/*` so Vite compiles the raw `.jsx` they publish under
 * their `"solid"` export condition. Upstream:
 * https://github.com/solidjs/vite-plugin-solid/issues/157
 */
export const sharedServerDeps = { inline: [/@solidjs\//] };
