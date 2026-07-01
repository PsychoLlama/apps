/**
 * Shared Vitest building blocks for the workspace's test suites.
 *
 * The unit suite runs centrally from the root `vitest.config.ts`; the browser
 * suite is split per package (each package owns a `vitest.browser.config.ts`
 * that re-exports `@dev/vitest-config/browser`, run under `chromium-lock`) so
 * turbo caches and reruns browser tests per package instead of booting Chromium
 * for the whole monorepo on every change. Both suites must transform source
 * through the *same* Vite plugin pipeline, so it lives here as the single
 * source of truth.
 */

import solid from 'vite-plugin-solid';
import Icons from 'unplugin-icons/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { instrumentationScope } from '@dev/build/vite-plugin/instrumentation-scope';
import { iconPacks } from '@dev/build/vite-plugin/icon-packs';

/**
 * The Vite plugin pipeline every suite shares — the Solid compiler, icon
 * virtual modules, and vanilla-extract — so a module under test transforms
 * exactly the way it does in the app. A factory (not a shared array) so each
 * config gets its own plugin instances rather than aliasing stateful ones.
 */
export const sharedPlugins = () => [
  instrumentationScope(),
  solid(),
  Icons({ compiler: 'solid' }),
  iconPacks(),
  vanillaExtractPlugin(),
];

/**
 * Inline `@solidjs/*` so Vite compiles the raw `.jsx` they publish under
 * their `"solid"` export condition. Upstream:
 * https://github.com/solidjs/vite-plugin-solid/issues/157
 */
export const sharedServerDeps = { inline: [/@solidjs\//] };
