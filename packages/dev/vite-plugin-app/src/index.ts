import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import type { PluginOption } from 'vite';
import { assertHashedAssets } from '@dev/vite-plugin-assert-hashed-assets';
import { gitignore } from '@dev/vite-plugin-gitignore';
import { instrumentationScope } from '@dev/vite-plugin-instrumentation-scope';
import { pwaManifest, type PwaManifestConfig } from '@dev/vite-plugin-pwa';
import { svgToPng } from '@dev/vite-plugin-svg-to-png';
import { solidOrSolidStart, type SolidFrameworkOptions } from './solid.ts';

export type {
  Configure,
  SolidFrameworkOptions,
  SolidPluginOptions,
  SolidStartPluginOptions,
} from './solid.ts';

export interface AppOptions extends SolidFrameworkOptions {
  /** Emit a web app manifest with raster icons. */
  pwa?: PwaManifestConfig;
}

/**
 * The plugin pipeline every package builds with: git-aware file
 * watching, instrumentation scopes, Solid (or SolidStart, for apps),
 * vanilla-extract, icon components and `?to-png=<size>` SVG imports,
 * plus opt-in PWA support. Package-specific plugins go alongside it.
 */
export const app = (options: AppOptions = {}): PluginOption[] => [
  gitignore(),
  instrumentationScope(),
  solidOrSolidStart(options),
  svgToPng(),
  options.pwa && pwaManifest(options.pwa),
  vanillaExtractPlugin(),
  Icons({ compiler: 'solid' }),
  assertHashedAssets(),
];
