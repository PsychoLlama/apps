import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import type { PluginOption } from 'vite';
import { assertHashedAssets } from '@dev/vite-plugin-assert-hashed-assets';
import { gitignore } from '@dev/vite-plugin-gitignore';
import { headers, type HeadersConfig } from '@dev/vite-plugin-headers';
import { inlineScript } from '@dev/vite-plugin-inline-script';
import { instrumentationScope } from '@dev/vite-plugin-instrumentation-scope';
import { pwaManifest, type PwaManifestConfig } from '@dev/vite-plugin-pwa';
import { redirect, type RedirectConfig } from '@dev/vite-plugin-redirects';
import {
  serviceWorker,
  type ServiceWorkerConfig,
} from '@dev/vite-plugin-service-worker';
import { svgToPng } from '@dev/vite-plugin-svg-to-png';
import { nitro, type NitroModuleOptions, type NitroOptions } from './nitro.ts';
import {
  solid,
  solidStart,
  type Configure,
  type SolidPluginOptions,
  type SolidStartPluginOptions,
} from './solid.ts';

interface CommonOptions {
  /**
   * Edits `vite-plugin-solid` options, after the house defaults. In apps,
   * these are SolidStart's `solid` options, edited before `solidStart`
   * runs, though SolidStart overrides `ssr` and `extensions`.
   */
  solid?: Configure<SolidPluginOptions>;
}

/** A library, built with plain Solid. Also what vitest runs under. */
export interface PackageOptions extends CommonOptions {
  type?: 'package';
}

/** A deployed app, built with SolidStart and prerendered by Nitro. */
export interface AppOptions extends CommonOptions, NitroModuleOptions {
  type: 'app';

  /**
   * Edits SolidStart options, after the house defaults (dev overlay off).
   * Its file router and server environments expect an `src/app.tsx`, and
   * don't run under vitest.
   */
  solidStart?: Configure<SolidStartPluginOptions>;

  /**
   * Edits Nitro options, after the house defaults (static preset, link
   * crawling, no precompression, `pageNotFound`).
   */
  nitro?: Configure<NitroOptions>;

  /** Emit a web app manifest with raster icons. */
  pwa?: PwaManifestConfig;

  /** Serve and build a service worker at `/service-worker.js`. */
  serviceWorker?: ServiceWorkerConfig;

  /** Generate Cloudflare's `_redirects`. Builds only. */
  redirect?: RedirectConfig;

  /**
   * More rules for Cloudflare's `_headers`, after the headers plugin's
   * defaults (immutable `/_build/*`). Builds only.
   */
  headers?: HeadersConfig;
}

export type SubstrateOptions = PackageOptions | AppOptions;

/**
 * The plugin pipeline every package builds with: git-aware file
 * watching, instrumentation scopes, Solid, vanilla-extract, icon
 * components, `?to-png=<size>` SVG imports and `?inline-script` head
 * scripts. Apps swap Solid for SolidStart, add Nitro, and can opt into a
 * PWA manifest, service worker and redirects. Apps always get `_headers`
 * with the house cache policy.
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
    app?.redirect && redirect(app.redirect),
    app && headers(app.headers),
    vanillaExtractPlugin(),
    Icons({ compiler: 'solid' }),
    assertHashedAssets(),
    app && nitro(app.nitro, app),
  ];
};
