import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import type { PluginOption } from 'vite';
import { assertHashedAssets } from '@dev/vite-plugin-assert-hashed-assets';
import { gitignore } from '@dev/vite-plugin-gitignore';
import { inlineScript } from '@dev/vite-plugin-inline-script';
import { instrumentationScope } from '@dev/vite-plugin-instrumentation-scope';
import { pwaManifest, type PwaManifestConfig } from '@dev/vite-plugin-pwa';
import {
  serviceWorker,
  type ServiceWorkerConfig,
} from '@dev/vite-plugin-service-worker';
import { svgToPng } from '@dev/vite-plugin-svg-to-png';
import {
  solid,
  solidStart,
  type Configure,
  type SolidPluginOptions,
  type SolidStartPluginOptions,
} from './solid.ts';

interface CommonOptions {
  /**
   * Options for `vite-plugin-solid`. The house babel plugins are added
   * to whatever `babel` holds. In apps, these become SolidStart's
   * `solid` options (its own `solid` wins per key), though SolidStart
   * overrides `ssr` and `extensions`.
   */
  solid?: Configure<SolidPluginOptions>;
}

/** A library, built with plain Solid. Also what vitest runs under. */
export interface PackageOptions extends CommonOptions {
  type?: 'package';
}

/** A deployed app, built with SolidStart. */
export interface AppOptions extends CommonOptions {
  type: 'app';

  /**
   * SolidStart options. Its file router and server environments expect
   * an `src/app.tsx`, and don't run under vitest. Defaults turn the dev
   * overlay off.
   */
  solidStart?: Configure<SolidStartPluginOptions>;

  /** Emit a web app manifest with raster icons. */
  pwa?: PwaManifestConfig;

  /** Serve and build a service worker at `/service-worker.js`. */
  serviceWorker?: ServiceWorkerConfig;
}

export type SubstrateOptions = PackageOptions | AppOptions;

/**
 * The plugin pipeline every package builds with: git-aware file
 * watching, instrumentation scopes, Solid, vanilla-extract, icon
 * components, `?to-png=<size>` SVG imports and `?inline-script` head
 * scripts. Apps swap Solid for SolidStart, and can opt into a PWA
 * manifest and service worker.
 * Package-specific plugins go alongside it.
 */
export const substrate = (options: SubstrateOptions = {}): PluginOption[] => {
  const app = options.type === 'app' ? options : undefined;

  return [
    gitignore(),
    instrumentationScope(),
    app ? solidStart(app.solid, app.solidStart) : solid(options.solid),
    svgToPng(),
    // Render-blocking budget per inlined script. The ceiling is a tripwire
    // for accidental bloat, e.g. an import that pulls a `.css.ts` module's
    // runtime registration into a head script.
    inlineScript({ maxBytes: 2048 }),
    app?.pwa && pwaManifest(app.pwa),
    app?.serviceWorker && serviceWorker(app.serviceWorker),
    vanillaExtractPlugin(),
    Icons({ compiler: 'solid' }),
    assertHashedAssets(),
  ];
};
