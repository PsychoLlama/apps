import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';
import { rasterizeSvg } from './resvg.ts';

interface IconConfig {
  /** Absolute path to the source SVG. */
  src: string;
  /** Square pixel sizes to rasterize. */
  sizes: number[];
}

interface PwaManifestConfig {
  icon: IconConfig;
  /**
   * Manifest fields. `icons` is synthesized from `icon.sizes` and
   * merged in last, so it can't be overridden here.
   */
  manifest: Record<string, unknown>;
}

const MANIFEST_FILE_NAME = 'manifest.webmanifest';

/** Stable path served by the dev middleware. Hashed in builds. */
const devIconPath = (size: number): string => `/icon-${size}.png`;

/**
 * Emits a PWA web app manifest plus its raster icons.
 *
 * The manifest is pinned at the output root (`/manifest.webmanifest`)
 * because `<link rel="manifest">` references it by literal URL from
 * the prerendered HTML — there's nowhere to thread a hashed path
 * through. Cloudflare's default `must-revalidate` keeps the response
 * fresh; the file changes on every deploy that re-hashes the icons.
 *
 * Icons are emitted via Rollup's hashed asset template so they land
 * under `/_build/assets/icon-<size>-<hash>.png` and inherit the
 * `immutable` long-cache rule from `_headers`. The manifest JSON
 * captures their final URLs through `this.getFileName`.
 *
 * Dev: a middleware rasterizes on demand and serves both the
 * manifest and icons with `Cache-Control: no-store` so edits to the
 * SVG surface after a reload.
 */
export const pwaManifest = (config: PwaManifestConfig): Plugin => {
  let base = '/';

  const buildManifestJson = (iconUrl: (size: number) => string): string =>
    JSON.stringify({
      ...config.manifest,
      icons: config.icon.sizes.map((size) => ({
        src: iconUrl(size),
        sizes: `${size}x${size}`,
        type: 'image/png',
      })),
    });

  return {
    name: '@dev/build:pwa-manifest',

    configResolved(resolved) {
      base = resolved.base;
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?', 1)[0];

        if (path === `/${MANIFEST_FILE_NAME}`) {
          res.setHeader('Content-Type', 'application/manifest+json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(buildManifestJson(devIconPath));
          return;
        }

        for (const size of config.icon.sizes) {
          if (path !== devIconPath(size)) continue;
          readFile(config.icon.src, 'utf8')
            .then((svg) => rasterizeSvg(svg, size))
            .then(
              (png) => {
                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Cache-Control', 'no-store');
                res.end(Buffer.from(png));
              },
              (err: unknown) => next(err),
            );
          return;
        }

        next();
      });
    },

    async generateBundle() {
      // Only emit during the client environment's pass. The SSR
      // environment shares the same output tree.
      if (this.environment.config.build.ssr) return;

      const svg = await readFile(config.icon.src, 'utf8');
      const refIds = new Map<number, string>();

      for (const size of config.icon.sizes) {
        const png = await rasterizeSvg(svg, size);
        const refId = this.emitFile({
          type: 'asset',
          // `name` (not `fileName`) lets Rollup hash the path
          // through the configured `assetFileNames` template, so the
          // emitted file inherits the `_build/*` long-cache rule.
          name: `icon-${size}.png`,
          source: Buffer.from(png),
        });
        refIds.set(size, refId);
      }

      this.emitFile({
        type: 'asset',
        // `fileName` pins the manifest at a stable path. The HTML
        // `<link rel="manifest">` hardcodes this URL, so it can't
        // ride the hashed asset template.
        fileName: MANIFEST_FILE_NAME,
        source: buildManifestJson((size) => {
          const refId = refIds.get(size);
          if (refId === undefined) {
            throw new Error(`Missing emitted icon for size ${size}`);
          }
          return `${base}${this.getFileName(refId)}`;
        }),
      });
    },
  };
};
