import { solidStart, type SolidStartOptions } from '@solidjs/start/config';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import type { PluginOption } from 'vite';
import { eraseOverloadSignatures } from '@dev/babel-plugin-erase-overload-signatures';
import { assertHashedAssets } from '@dev/vite-plugin-assert-hashed-assets';
import { gitignore } from '@dev/vite-plugin-gitignore';
import { instrumentationScope } from '@dev/vite-plugin-instrumentation-scope';
import { pwaManifest, type PwaManifestConfig } from '@dev/vite-plugin-pwa';
import { svgToPng } from '@dev/vite-plugin-svg-to-png';

/**
 * Extra SolidStart options. `solid.babel` is reserved: the house babel
 * plugins go there, and Solid accepts either an object or a function,
 * so a caller's value can't be merged safely.
 */
export interface SolidStartOverrides extends Omit<SolidStartOptions, 'solid'> {
  solid?: Omit<NonNullable<SolidStartOptions['solid']>, 'babel'>;
}

export interface AppOptions {
  /**
   * SolidStart, with the house babel plugins and the dev overlay off.
   * Pass options to extend it, or `false` to leave it out.
   */
  solidStart?: SolidStartOverrides | false;

  /** Emit a web app manifest with raster icons. */
  pwa?: PwaManifestConfig;
}

/**
 * The plugin pipeline every app builds with: git-aware file watching,
 * instrumentation scopes, vanilla-extract, icon components,
 * `?to-png=<size>` SVG imports, and SolidStart, plus opt-in PWA
 * support. App-specific plugins go alongside it in the app's own config.
 */
export const app = (options: AppOptions = {}): PluginOption[] => {
  const { solidStart: startOptions = {}, pwa } = options;

  return [
    gitignore(),
    instrumentationScope(),
    startOptions &&
      solidStart({
        // Suppresses the dev toolbar added in 2.0.0-rc.2, which otherwise
        // pins a persistent overlay to every dev page. Turning it off swaps
        // `<DevToolbar>` back out for the plain error boundary, so uncaught
        // errors still surface — just as the 500 fallback plus a console
        // trace instead of the toolbar's error viewer.
        devOverlay: false,
        ...startOptions,
        solid: {
          ...startOptions.solid,
          babel: { plugins: [eraseOverloadSignatures()] },
        },
      }),
    svgToPng(),
    pwa && pwaManifest(pwa),
    vanillaExtractPlugin(),
    Icons({ compiler: 'solid' }),
    assertHashedAssets(),
  ];
};
