import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import Icons from 'unplugin-icons/vite';
import type { PluginOption } from 'vite';
import { assertHashedAssets } from '@dev/vite-plugin-assert-hashed-assets';
import { gitignore } from '@dev/vite-plugin-gitignore';
import { inlineScript } from '@dev/vite-plugin-inline-script';
import { instrumentationScope } from '@dev/vite-plugin-instrumentation-scope';
import { pwaManifest, type PwaManifestConfig } from '@dev/vite-plugin-pwa';
import { svgToPng } from '@dev/vite-plugin-svg-to-png';
import { solidOrSolidStart, type SolidFrameworkOptions } from './solid.ts';

export interface SubstrateOptions extends SolidFrameworkOptions {
  /** Emit a web app manifest with raster icons. */
  pwa?: PwaManifestConfig;
}

/**
 * The plugin pipeline every package builds with: git-aware file
 * watching, instrumentation scopes, Solid (or SolidStart, for apps),
 * vanilla-extract, icon components, `?to-png=<size>` SVG imports and
 * `?inline-script` head scripts, plus opt-in PWA support.
 * Package-specific plugins go alongside it.
 */
export const substrate = (options: SubstrateOptions = {}): PluginOption[] => [
  gitignore(),
  instrumentationScope(),
  solidOrSolidStart(options),
  svgToPng(),
  // Render-blocking budget per inlined script. The ceiling is a tripwire
  // for accidental bloat, e.g. an import that pulls a `.css.ts` module's
  // runtime registration into a head script.
  inlineScript({ maxBytes: 2048 }),
  options.pwa && pwaManifest(options.pwa),
  vanillaExtractPlugin(),
  Icons({ compiler: 'solid' }),
  assertHashedAssets(),
];
